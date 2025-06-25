import { jest, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import * as authUtil from '../../../src/util/authUtil';
import { userFactory, setupUser } from '../../utils/userFactory'; // Import UserFactory

describe('POST /refresh-token', () => {
  setupIntegrationTests();

  // Helper to setup user and tokens

  test('should refresh token with valid refresh token in body', async () => {
    // Arrange
    const { user, userData, accessToken, refreshToken } = await setupUser();

    const refreshData = {
      userId: user.id,
      refreshToken,
    };

    // Act
    const response = await request(app).post('/api/v1/refresh-token').send(refreshData).expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.user.accessToken).toBeDefined();
    expect(response.body.data.user.refreshToken).toBeDefined();
    expect(response.body.data.user.accessToken).not.toBe(accessToken); // Should be new token
    expect(response.body.data.user.refreshToken).not.toBe(refreshToken); // Should be rotated
    expect(response.body.data.user.password).toBeUndefined();

    // Verify refresh token cookie is set
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=');
  });

  test('should refresh token with valid refresh token in cookie', async () => {
    // Arrange
    const { user, userData, refreshToken } = await setupUser();

    const refreshData = {
      userId: user.id,
      // No refreshToken in body - will use cookie
    };

    // Act
    const response = await request(app)
      .post('/api/v1/refresh-token')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .send(refreshData)
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.user.accessToken).toBeDefined();
    expect(response.body.data.user.refreshToken).toBeDefined();
    expect(response.body.data.user.refreshToken).not.toBe(refreshToken); // Should be rotated
  });

  test('should return 400 if refresh token is invalid', async () => {
    // Arrange
    const { user, userData } = await setupUser();

    const refreshData = {
      userId: user.id,
      refreshToken: authUtil.generateRefreshToken(user.id, 'test-device-id'),
    };

    // Act
    const response = await request(app).post('/api/v1/refresh-token').send(refreshData).expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Invalid Refresh Token');
  });

  test('should return 400 if refresh token does not exist in Redis', async () => {
    // Arrange
    const user = await userModel.create(userFactory.create({ isVerified: true }));

    const refreshToken = authUtil.generateRefreshToken(user.id, 'test-device-id');

    const refreshData = {
      userId: user.id,
      refreshToken,
    };

    // Act
    const response = await request(app).post('/api/v1/refresh-token').send(refreshData).expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Invalid Refresh Token');
  });

  test('should return 400 if user does not exist', async () => {
    // Arrange
    const nonExistentUserId = new userModel().id;
    const deviceId = 'test-device-id';
    const refreshToken = authUtil.generateRefreshToken(nonExistentUserId, deviceId);
    await authUtil.storeRefreshToken(nonExistentUserId, deviceId, refreshToken);

    const refreshData = {
      userId: nonExistentUserId,
      refreshToken,
    };

    // Act
    const response = await request(app).post('/api/v1/refresh-token').send(refreshData).expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('User does not exist');
  });

  test('should return 400 if required fields are missing', async () => {
    // Arrange
    const refreshData = {
      // Missing userId and refreshToken
    };

    // Act
    const response = await request(app).post('/api/v1/refresh-token').send(refreshData).expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Missing required field: userId');
  });
});
