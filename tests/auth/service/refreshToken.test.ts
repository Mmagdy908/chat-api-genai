import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { refreshToken } from '../../../src/services/authService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as authUtil from '../../../src/util/authUtil';
import userModel from '../../../src/models/user';
import AppError from '../../../src/util/appError';
import { userFactory } from '../../utils/userFactory';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/util/authUtil');

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

    const userMock = new userModel(userFactory.create({ isVerified: true }));

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
