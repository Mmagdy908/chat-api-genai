import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { userLogin } from '../../../src/services/authService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as authUtil from '../../../src/util/authUtil';
import Email from '../../../src/util/email';
import userModel from '../../../src/models/user';
import AppError from '../../../src/util/appError';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/util/authUtil');

describe('authService - userLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully login user with correct credentials', async () => {
    // Arrange
    const credentials = {
      email: 'john@example.com',
      password: 'password123',
    };

    const userMock = new userModel({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      isVerified: true,
    });

    // Mock the checkPassword method
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
    expect(authUtil.login).toHaveBeenCalledWith(userMock.id);
    expect(result).toEqual({
      user: userMock,
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    });
  });

  test('should throw 401 error if user does not exist', async () => {
    // Arrange
    const credentials = {
      email: 'nonexistent@example.com',
      password: 'password123',
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
      email: 'john@example.com',
      password: 'wrongpassword',
    };

    const userMock = new userModel({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      isVerified: true,
    });

    // Mock the checkPassword method to return false
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
    const credentials = {
      email: 'john@example.com',
      password: 'password123',
    };

    const userMock = new userModel({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      isVerified: false,
    });

    const verifyEmailOTP = '123456';

    // Mock the checkPassword method
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
    expect(authUtil.storeOTP).toHaveBeenCalledWith(userMock.id, 'verifyOTP', verifyEmailOTP);
    expect(Email.prototype.sendVerificationEmail).toHaveBeenCalled();
    expect(authUtil.login).not.toHaveBeenCalled();
  });
});
