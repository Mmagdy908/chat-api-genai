import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { userRegister, verifyEmail, userLogin } from '../../src/services/authService';
import * as userRepository from '../../src/repositories/userRepository';
import * as authUtil from '../../src/util/authUtil';
import Email from '../../src/util/email';
import userModel from '../../src/models/user';
import AppError from '../../src/util/appError';

jest.mock('../../src/repositories/userRepository');
jest.mock('../../src/util/authUtil');

describe('authService - userRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register user and send verification email', async () => {
    // Arrange
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    };
    const createdUser = new userModel(userData);
    const verifyEmailOTP = '123456';

    // ## alternative way for mocking
    // const mockedUserRepository = jest.mocked(userRepository);
    // mockedUserRepository.create.mockResolvedValue(createdUser);

    jest.spyOn(userRepository, 'create').mockResolvedValue(createdUser);
    jest.spyOn(authUtil, 'generateOTP').mockResolvedValue(verifyEmailOTP);
    jest.spyOn(authUtil, 'storeOTP').mockResolvedValue(undefined);
    jest.spyOn(Email.prototype, 'sendVerificationEmail').mockResolvedValue(undefined);

    // Act
    const result = await userRegister(userData);

    // Assert
    expect(userRepository.create).toHaveBeenCalledWith(userData);
    expect(authUtil.generateOTP).toHaveBeenCalled();
    expect(authUtil.storeOTP).toHaveBeenCalledWith(result.id, 'verifyOTP', '123456');
    expect(Email.prototype.sendVerificationEmail).toHaveBeenCalled();
    expect(result).toEqual(createdUser);
  });

  test('should throw error if user creation fails', async () => {
    // Arrange
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    jest
      .spyOn(userRepository, 'create')
      .mockRejectedValue(new AppError(400, 'Email already exists'));

    // Act & Assert
    await expect(userRegister(userData)).rejects.toThrow('Email already exists');
    expect(authUtil.generateOTP).not.toHaveBeenCalled();
    expect(authUtil.storeOTP).not.toHaveBeenCalled();
    expect(Email.prototype.sendVerificationEmail).not.toHaveBeenCalled();
  });
});

describe('authService - verify email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should succeed to verify email', async () => {
    // Arrange
    const userMock = new userModel({
      firstName: 'Ahmed',
      lastName: 'Essam',
      email: 'ahmed@example.com',
      password: 'password123',
    });

    const verifyEmailOTP = '123456';

    jest.mocked(userRepository.getById).mockResolvedValue(userMock);
    jest.mocked(authUtil.verifyOTP).mockResolvedValue(true);
    jest.mocked(userRepository.updateById).mockResolvedValue({
      ...userMock.toObject(),
      isVerified: true,
    });

    jest
      .mocked(authUtil.login)
      .mockResolvedValue({ accessToken: 'accessToken', refreshToken: 'refreshToken' });

    // Act
    const { user, accessToken, refreshToken } = await verifyEmail(userMock.id, verifyEmailOTP);

    // Assert
    expect(userMock.isVerified).toBeFalsy();

    expect(userRepository.getById).toHaveBeenCalledWith(userMock.id);
    expect(authUtil.verifyOTP).toHaveBeenCalledWith(userMock.id, 'verifyOTP', verifyEmailOTP);
    expect(userRepository.updateById).toHaveBeenCalledWith(userMock.id, { isVerified: true });
    expect(authUtil.login).toHaveBeenCalledWith(userMock.id);

    expect(user.id).toBe(userMock.id);
    expect(user.email).toBe(userMock.email);
    expect(user.isVerified).toBeTruthy();
    expect(accessToken).toBe('accessToken');
    expect(refreshToken).toBe('refreshToken');
  });

  test('should throw 400 if otp is incorrect', async () => {
    // Arrange
    const userMock = new userModel({
      firstName: 'Ahmed',
      lastName: 'Essam',
      email: 'ahmed@example.com',
      password: 'password123',
    });

    const verifyEmailOTP = '123456';

    jest.mocked(userRepository.getById).mockResolvedValue(userMock);
    jest.mocked(authUtil.verifyOTP).mockResolvedValue(false);

    // Act & Assert
    await expect(verifyEmail(userMock.id, verifyEmailOTP)).rejects.toThrow(
      new AppError(400, 'Invalid verification OTP')
    );

    expect(userRepository.getById).toHaveBeenCalledWith(userMock.id);
    expect(authUtil.verifyOTP).toHaveBeenCalledWith(userMock.id, 'verifyOTP', verifyEmailOTP);
    expect(userRepository.updateById).not.toHaveBeenCalled();
    expect(authUtil.login).not.toHaveBeenCalled();
  });

  test('should throw 404 if user is not found', async () => {
    // Arrange
    const userMock = new userModel({
      firstName: 'Ahmed',
      lastName: 'Essam',
      email: 'ahmed@example.com',
      password: 'password123',
    });

    const verifyEmailOTP = '123456';

    jest.mocked(userRepository.getById).mockResolvedValue(null);

    // Act
    await expect(verifyEmail(userMock.id, verifyEmailOTP)).rejects.toThrow(
      new AppError(404, 'User Not Found')
    );
    // Assert
    expect(userMock.isVerified).toBeFalsy();

    expect(userRepository.getById).toHaveBeenCalledWith(userMock.id);
    expect(authUtil.verifyOTP).not.toHaveBeenCalled();
    expect(userRepository.updateById).not.toHaveBeenCalled();
    expect(authUtil.login).not.toHaveBeenCalled();
  });
});

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
