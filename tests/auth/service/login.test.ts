import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { userLogin } from '../../../src/services/authService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as authUtil from '../../../src/util/authUtil';
import Email from '../../../src/util/email';
import userModel from '../../../src/models/user';
import { AppError } from '../../../src/util/appError';
import { MockUser, userFactory } from '../../utils/userFactory';
import { User } from '../../../src/interfaces/models/user';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/util/authUtil');

describe('authService - userLogin', () => {
  let userData: MockUser;
  let userMock: User;
  beforeEach(() => {
    jest.clearAllMocks();
    userData = userFactory.create({ isVerified: true });
    userMock = new userModel(userData);
  });

  test('should successfully login user with correct credentials', async () => {
    // Arrange

    const credentials = {
      email: userMock.email,
      password: userMock.password,
    };

    jest.spyOn(userMock, 'checkPassword').mockResolvedValue(true);
    jest.mocked(userRepository.getByEmail).mockResolvedValue(userMock);
    jest
      .mocked(authUtil.login)
      .mockResolvedValue({ accessToken: 'accessToken', refreshToken: 'refreshToken' });

    // Act
    const result = await userLogin(credentials);

    // Assert
    expect(userRepository.getByEmail).toHaveBeenCalledWith(credentials.email);
    expect(userMock.checkPassword).toHaveBeenCalledWith(credentials.password);
    expect(authUtil.login).toHaveBeenCalledWith(userMock.id.toString());
    expect(result).toEqual({
      user: userMock,
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    });
  });

  test('should throw 401 error if user does not exist', async () => {
    // Arrange
    const credentials = {
      email: userMock.email,
      password: userMock.password,
    };

    jest.mocked(userRepository.getByEmail).mockResolvedValue(null);

    // Act & Assert
    await expect(userLogin(credentials)).rejects.toThrow(
      new AppError(401, 'Incorrect email or password')
    );

    expect(userRepository.getByEmail).toHaveBeenCalledWith(credentials.email);
    expect(authUtil.login).not.toHaveBeenCalled();
  });

  test('should throw 401 error if password is incorrect', async () => {
    // Arrange
    const credentials = {
      email: userMock.email,
      password: 'wrongpassword',
    };

    jest.spyOn(userMock, 'checkPassword').mockResolvedValue(false);
    jest.mocked(userRepository.getByEmail).mockResolvedValue(userMock);

    // Act & Assert
    await expect(userLogin(credentials)).rejects.toThrow(
      new AppError(401, 'Incorrect email or password')
    );

    expect(userRepository.getByEmail).toHaveBeenCalledWith(credentials.email);
    expect(userMock.checkPassword).toHaveBeenCalledWith(credentials.password);
    expect(authUtil.login).not.toHaveBeenCalled();
  });

  test('should throw 401 error and resend verification email if user is not verified', async () => {
    // Arrange
    userData = userFactory.create({ isVerified: false });
    userMock = new userModel(userData);

    const credentials = {
      email: userMock.email,
      password: userMock.password,
    };

    const verifyEmailOTP = '123456';

    jest.spyOn(userMock, 'checkPassword').mockResolvedValue(true);
    jest.mocked(userRepository.getByEmail).mockResolvedValue(userMock);
    jest.spyOn(authUtil, 'generateOTP').mockResolvedValue(verifyEmailOTP);
    jest.spyOn(authUtil, 'storeOTP').mockResolvedValue(undefined);
    jest.spyOn(Email.prototype, 'sendVerificationEmail').mockResolvedValue(undefined);

    // Act & Assert
    await expect(userLogin(credentials)).rejects.toThrow(
      new AppError(401, 'This email is not verified. An OTP is sent to your email')
    );

    expect(userRepository.getByEmail).toHaveBeenCalledWith(credentials.email);
    expect(userMock.checkPassword).toHaveBeenCalledWith(credentials.password);
    expect(authUtil.generateOTP).toHaveBeenCalled();
    expect(authUtil.storeOTP).toHaveBeenCalledWith(
      userMock.id.toString(),
      'verifyOTP',
      verifyEmailOTP
    );
    expect(Email.prototype.sendVerificationEmail).toHaveBeenCalled();
    expect(authUtil.login).not.toHaveBeenCalled();
  });
});
