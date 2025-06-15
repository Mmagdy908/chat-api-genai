import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { userRegister, verifyEmail, userLogin, refreshToken } from '../../src/services/authService';
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

describe('authService - refreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully refresh token with valid refresh token', async () => {
    // Arrange
    const userId = 'user123';
    const deviceId = 'device456';
    const oldRefreshToken = 'valid-refresh-token';
    const newAccessToken = 'new-access-token';
    const newRefreshToken = 'new-refresh-token';

    const userMock = new userModel({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      isVerified: true,
    });

    const tokenPayload = {
      userId: userId,
      deviceId: deviceId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    };

    jest.mocked(authUtil.verifyToken).mockResolvedValue(tokenPayload);
    jest.mocked(authUtil.retrieveRefreshToken).mockResolvedValue(oldRefreshToken);
    jest.mocked(userRepository.getById).mockResolvedValue(userMock);
    jest.mocked(authUtil.generateAccessToken).mockReturnValue(newAccessToken);
    jest.mocked(authUtil.generateRefreshToken).mockReturnValue(newRefreshToken);
    jest.mocked(authUtil.storeRefreshToken).mockResolvedValue(undefined);

    // Act
    const result = await refreshToken(userId, oldRefreshToken);

    // Assert
    expect(authUtil.verifyToken).toHaveBeenCalledWith(oldRefreshToken);
    expect(authUtil.retrieveRefreshToken).toHaveBeenCalledWith(userId, deviceId);
    expect(userRepository.getById).toHaveBeenCalledWith(userId);
    expect(authUtil.generateAccessToken).toHaveBeenCalledWith(userId);
    expect(authUtil.generateRefreshToken).toHaveBeenCalledWith(userId, deviceId);
    expect(authUtil.storeRefreshToken).toHaveBeenCalledWith(userId, deviceId, newRefreshToken);

    expect(result).toEqual({
      user: userMock,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });

  test('should throw 400 error if refresh token is invalid (verification fails)', async () => {
    // Arrange
    const userId = 'user123';
    const oldRefreshToken = 'invalid-refresh-token';

    jest.mocked(authUtil.verifyToken).mockRejectedValue(new Error('Invalid token'));

    // Act & Assert
    await expect(refreshToken(userId, oldRefreshToken)).rejects.toThrow('Invalid token');

    expect(authUtil.verifyToken).toHaveBeenCalledWith(oldRefreshToken);
    expect(authUtil.retrieveRefreshToken).not.toHaveBeenCalled();
    expect(userRepository.getById).not.toHaveBeenCalled();
  });

  test('should throw 400 error if retrieved refresh token does not match provided token', async () => {
    // Arrange
    const userId = 'user123';
    const deviceId = 'device456';
    const oldRefreshToken = 'valid-refresh-token';
    const storedRefreshToken = 'different-refresh-token';

    const tokenPayload = {
      userId: userId,
      deviceId: deviceId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    };

    jest.mocked(authUtil.verifyToken).mockResolvedValue(tokenPayload);
    jest.mocked(authUtil.retrieveRefreshToken).mockResolvedValue(storedRefreshToken);

    // Act & Assert
    await expect(refreshToken(userId, oldRefreshToken)).rejects.toThrow(
      new AppError(400, 'Invalid Refresh Token')
    );

    expect(authUtil.verifyToken).toHaveBeenCalledWith(oldRefreshToken);
    expect(authUtil.retrieveRefreshToken).toHaveBeenCalledWith(userId, deviceId);
    expect(userRepository.getById).not.toHaveBeenCalled();
  });

  test('should throw 400 error if user ID in payload does not match provided user ID', async () => {
    // Arrange
    const userId = 'user123';
    const deviceId = 'device456';
    const oldRefreshToken = 'valid-refresh-token';

    const tokenPayload = {
      userId: 'different-user-id',
      deviceId: deviceId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    };

    jest.mocked(authUtil.verifyToken).mockResolvedValue(tokenPayload);
    jest.mocked(authUtil.retrieveRefreshToken).mockResolvedValue(oldRefreshToken);

    // Act & Assert
    await expect(refreshToken(userId, oldRefreshToken)).rejects.toThrow(
      new AppError(400, 'Invalid Refresh Token')
    );

    expect(authUtil.verifyToken).toHaveBeenCalledWith(oldRefreshToken);
    expect(authUtil.retrieveRefreshToken).toHaveBeenCalledWith(userId, deviceId);
    expect(userRepository.getById).not.toHaveBeenCalled();
  });

  test('should throw 400 error if user does not exist', async () => {
    // Arrange
    const userId = 'user123';
    const deviceId = 'device456';
    const oldRefreshToken = 'valid-refresh-token';

    const tokenPayload = {
      userId: userId,
      deviceId: deviceId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    };

    jest.mocked(authUtil.verifyToken).mockResolvedValue(tokenPayload);
    jest.mocked(authUtil.retrieveRefreshToken).mockResolvedValue(oldRefreshToken);
    jest.mocked(userRepository.getById).mockResolvedValue(null);

    // Act & Assert
    await expect(refreshToken(userId, oldRefreshToken)).rejects.toThrow(
      new AppError(400, 'User does not exist')
    );

    expect(authUtil.verifyToken).toHaveBeenCalledWith(oldRefreshToken);
    expect(authUtil.retrieveRefreshToken).toHaveBeenCalledWith(userId, deviceId);
    expect(userRepository.getById).toHaveBeenCalledWith(userId);
    expect(authUtil.generateAccessToken).not.toHaveBeenCalled();
  });
});
