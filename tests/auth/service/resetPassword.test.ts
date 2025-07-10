import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { resetPassword } from '../../../src/services/authService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as authUtil from '../../../src/util/authUtil';
import userModel from '../../../src/models/user';
import { AppError } from '../../../src/util/appError';
import { userFactory } from '../../utils/userFactory';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/util/authUtil');

describe('authService - resetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should reset password successfully and logout all devices', async () => {
    // Arrange
    const userData = userFactory.create();
    const userMock = new userModel(userData);
    const email = userMock.email;
    const resetOTP = '123456';
    const newPassword = 'newPassword123';

    jest.spyOn(userRepository, 'getByEmail').mockResolvedValue(userMock);
    jest.spyOn(authUtil, 'verifyOTP').mockResolvedValue(true);
    jest.spyOn(userRepository, 'saveUser');
    jest.spyOn(authUtil, 'deleteAllRefreshTokens').mockResolvedValue(undefined);

    // Act
    await resetPassword(email, resetOTP, newPassword);

    // Assert
    expect(userRepository.getByEmail).toHaveBeenCalledWith(email);
    expect(authUtil.verifyOTP).toHaveBeenCalledWith(userMock.id, 'resetOTP', resetOTP);
    expect(userMock.password).toBe(newPassword);
    expect(userMock.passwordUpdatedAt).toBeInstanceOf(Date);
    expect(userRepository.saveUser).toHaveBeenCalledWith(userMock);
    expect(authUtil.deleteAllRefreshTokens).toHaveBeenCalledWith(userMock.id);
  });

  test('should throw error if user not found', async () => {
    // Arrange
    const userData = userFactory.create();
    const email = userData.email as string;
    const resetOTP = '123456';
    const newPassword = 'newPassword123';

    jest.spyOn(userRepository, 'getByEmail').mockResolvedValue(null);

    // Act & Assert
    await expect(resetPassword(email, resetOTP, newPassword)).rejects.toThrow(
      new AppError(400, 'Invalid reset password OTP ')
    );

    expect(userRepository.getByEmail).toHaveBeenCalledWith(email);
    expect(authUtil.verifyOTP).not.toHaveBeenCalled();
    expect(userRepository.saveUser).not.toHaveBeenCalled();
    expect(authUtil.deleteAllRefreshTokens).not.toHaveBeenCalled();
  });

  test('should throw error if OTP is invalid', async () => {
    // Arrange
    const userData = userFactory.create();
    const userMock = new userModel(userData);
    const email = userMock.email;
    const resetOTP = 'wrongOTP';
    const newPassword = 'newPassword123';

    jest.spyOn(userRepository, 'getByEmail').mockResolvedValue(userMock);
    jest.spyOn(authUtil, 'verifyOTP').mockResolvedValue(false);

    // Act & Assert
    await expect(resetPassword(email, resetOTP, newPassword)).rejects.toThrow(
      new AppError(400, 'Invalid reset password OTP ')
    );

    expect(userRepository.getByEmail).toHaveBeenCalledWith(email);
    expect(authUtil.verifyOTP).toHaveBeenCalledWith(userMock.id, 'resetOTP', resetOTP);
    expect(userRepository.saveUser).not.toHaveBeenCalled();
    expect(authUtil.deleteAllRefreshTokens).not.toHaveBeenCalled();
  });
});
