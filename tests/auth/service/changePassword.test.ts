import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { updatePassword } from '../../../src/services/authService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as authUtil from '../../../src/util/authUtil';
import userModel from '../../../src/models/user';
import { AppError } from '../../../src/util/appError';
import { userFactory } from '../../utils/userFactory';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/util/authUtil');

describe('authService - updatePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update password successfully and return new tokens', async () => {
    // Arrange
    const userData = userFactory.create();
    const userMock = new userModel(userData);
    const oldPassword = userData.password as string;
    const newPassword = 'newPassword123';
    const updatedUser = { ...userMock.toObject(), password: newPassword };

    jest.spyOn(userMock, 'checkPassword').mockResolvedValue(true);
    jest.spyOn(userRepository, 'create').mockResolvedValue(updatedUser as any);
    jest.spyOn(authUtil, 'deleteAllRefreshTokens').mockResolvedValue(undefined);
    jest.spyOn(authUtil, 'login').mockResolvedValue({
      accessToken: 'newAccessToken',
      refreshToken: 'newRefreshToken',
    });

    // Act
    const result = await updatePassword(userMock, oldPassword, newPassword);

    // Assert
    expect(userMock.checkPassword).toHaveBeenCalledWith(oldPassword);
    expect(userRepository.create).toHaveBeenCalledWith(userMock);
    expect(authUtil.deleteAllRefreshTokens).toHaveBeenCalledWith(updatedUser.id.toString());
    expect(authUtil.login).toHaveBeenCalledWith(userMock.id);

    expect(result.user).toEqual(updatedUser);
    expect(result.accessToken).toBe('newAccessToken');
    expect(result.refreshToken).toBe('newRefreshToken');
  });

  test('should throw error if old password is incorrect', async () => {
    // Arrange
    const userData = userFactory.create();
    const userMock = new userModel(userData);
    const oldPassword = 'wrongPassword';
    const newPassword = 'newPassword123';

    jest.spyOn(userMock, 'checkPassword').mockResolvedValue(false);

    // Act & Assert
    await expect(updatePassword(userMock, oldPassword, newPassword)).rejects.toThrow(
      new AppError(400, 'Wrong old password')
    );

    expect(userMock.checkPassword).toHaveBeenCalledWith(oldPassword);
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(authUtil.deleteAllRefreshTokens).not.toHaveBeenCalled();
    expect(authUtil.login).not.toHaveBeenCalled();
  });

  test('should throw error if new password is same as old password', async () => {
    // Arrange
    const userData = userFactory.create();
    const userMock = new userModel(userData);
    const oldPassword = userData.password as string;
    const newPassword = oldPassword;

    jest.spyOn(userMock, 'checkPassword').mockResolvedValue(true);

    // Act & Assert
    await expect(updatePassword(userMock, oldPassword, newPassword)).rejects.toThrow(
      new AppError(400, "New password can't be the same as your current password")
    );

    expect(userMock.checkPassword).toHaveBeenCalledWith(oldPassword);
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(authUtil.deleteAllRefreshTokens).not.toHaveBeenCalled();
    expect(authUtil.login).not.toHaveBeenCalled();
  });
});
