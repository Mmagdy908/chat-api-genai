import { jest, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import * as authUtil from '../../../src/util/authUtil';

describe('POST /change-password', () => {
  setupIntegrationTests();
  test('should change password successfully for authenticated user', async () => {
    // Arrange
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'oldPassword123',
      isVerified: true,
    };

    const user = await userModel.create(userData);
    const { accessToken } = await authUtil.login(user.id);

    const changePasswordData = {
      oldPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    jest.spyOn(authUtil, 'login').mockResolvedValue({
      accessToken: 'newAccessToken',
      refreshToken: 'newRefreshToken',
    });

    // Act
    const response = await request(app)
      .post('/api/v1/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(changePasswordData)
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.data.user.email).toBe('john@example.com');
    expect(response.body.data.user.accessToken).toBe('newAccessToken');
    expect(response.body.data.user.refreshToken).toBe('newRefreshToken');

    // Verify password was changed in database
    const updatedUser = await userModel.findById(user.id);
    expect(updatedUser?.passwordUpdatedAt).toBeDefined();
  });

  test('should return 400 if old password is incorrect', async () => {
    // Arrange
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'oldPassword123',
      isVerified: true,
    };

    const user = await userModel.create(userData);
    const { accessToken } = await authUtil.login(user.id);

    const changePasswordData = {
      oldPassword: 'wrongPassword',
      newPassword: 'newPassword123',
    };

    // Act
    const response = await request(app)
      .post('/api/v1/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(changePasswordData)
      .expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Wrong old password');
  });

  test('should return 400 if new password is same as old password', async () => {
    // Arrange
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      isVerified: true,
    };

    const user = await userModel.create(userData);
    const { accessToken } = await authUtil.login(user.id);

    const changePasswordData = {
      oldPassword: 'password123',
      newPassword: 'password123',
    };

    // Act
    const response = await request(app)
      .post('/api/v1/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(changePasswordData)
      .expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain(
      "New password can't be the same as your current password"
    );
  });

  test('should return 401 if user is not authenticated', async () => {
    // Arrange
    const changePasswordData = {
      oldPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    // Act
    const response = await request(app)
      .post('/api/v1/change-password')
      .send(changePasswordData)
      .expect(401);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('You are not logged in');
  });

  test('should return 400 if required fields are missing', async () => {
    // Arrange
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'oldPassword123',
      isVerified: true,
    };

    const user = await userModel.create(userData);
    const { accessToken } = await authUtil.login(user.id);

    const changePasswordData = {
      oldPassword: 'oldPassword123',
      // newPassword missing
    };

    // Act
    const response = await request(app)
      .post('/api/v1/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(changePasswordData)
      .expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Missing required field: newPassword');
  });
});
