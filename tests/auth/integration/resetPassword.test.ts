import { jest, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import * as authUtil from '../../../src/util/authUtil';
import { userFactory, setupUser } from '../../utils/userFactory'; // Import UserFactory

describe('POST /reset-password', () => {
  setupIntegrationTests();

  test('should reset password successfully with valid OTP', async () => {
    // Arrange
    const { user, userData } = await setupUser();
    const resetOTP = '123456';

    jest.spyOn(authUtil, 'verifyOTP').mockResolvedValue(true);
    jest.spyOn(authUtil, 'deleteAllRefreshTokens').mockResolvedValue(undefined);

    const resetPasswordData = {
      email: userData.email,
      resetOTP,
      newPassword: 'newPassword123',
    };

    // Act
    const response = await request(app)
      .post('/api/v1/reset-password')
      .send(resetPasswordData)
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Password is reset successfuly. Please Log in');

    // Verify OTP verification and token cleanup
    expect(authUtil.verifyOTP).toHaveBeenCalledWith(user.id, 'resetOTP', resetOTP);
    expect(authUtil.deleteAllRefreshTokens).toHaveBeenCalledWith(user.id);

    // Verify password was updated in database
    const updatedUser = await userModel.findById(user.id);
    expect(updatedUser?.password).not.toBe(userData.password);
    expect(updatedUser?.passwordUpdatedAt).toBeDefined();
  });

  test('should return 400 if OTP is invalid', async () => {
    // Arrange
    const { userData } = await setupUser();

    jest.spyOn(authUtil, 'verifyOTP').mockResolvedValue(false);
    jest.spyOn(authUtil, 'deleteAllRefreshTokens');

    const resetPasswordData = {
      email: userData.email,
      resetOTP: 'wrongOTP',
      newPassword: 'newPassword123',
    };

    // Act
    const response = await request(app)
      .post('/api/v1/reset-password')
      .send(resetPasswordData)
      .expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Invalid reset password OTP');

    // Verify no token cleanup occurred
    expect(authUtil.deleteAllRefreshTokens).not.toHaveBeenCalled();
  });

  test('should return 400 if user does not exist', async () => {
    // Arrange
    jest.spyOn(authUtil, 'verifyOTP');
    jest.spyOn(authUtil, 'deleteAllRefreshTokens');

    const resetPasswordData = {
      email: 'nonexistent@example.com',
      resetOTP: '123456',
      newPassword: 'newPassword123',
    };

    // Act
    const response = await request(app)
      .post('/api/v1/reset-password')
      .send(resetPasswordData)
      .expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Invalid reset password OTP');

    // Verify no OTP verification or token cleanup
    expect(authUtil.verifyOTP).not.toHaveBeenCalled();
    expect(authUtil.deleteAllRefreshTokens).not.toHaveBeenCalled();
  });

  test('should return 400 if required fields are missing', async () => {
    // Arrange
    const resetPasswordData = {
      email: 'ahmedsamir@example.com',
      resetOTP: '123456',
      // newPassword missing
    };

    // Act
    const response = await request(app)
      .post('/api/v1/reset-password')
      .send(resetPasswordData)
      .expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Missing required field: newPassword');
  });
});
