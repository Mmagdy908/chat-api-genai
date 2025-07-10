import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { verifyEmail } from '../../../src/services/authService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as authUtil from '../../../src/util/authUtil';
import userModel from '../../../src/models/user';
import { AppError } from '../../../src/util/appError';
import { userFactory } from '../../utils/userFactory';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/util/authUtil');

describe('authService - verify email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should succeed to verify email', async () => {
    // Arrange
    const userData = userFactory.create();
    const userMock = new userModel(userData);
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
    const userData = userFactory.create();
    const userMock = new userModel(userData);
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
    const userData = userFactory.create();
    const userMock = new userModel(userData);
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
