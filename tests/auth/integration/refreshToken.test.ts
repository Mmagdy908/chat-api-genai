import { jest, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import * as authUtil from '../../../src/util/authUtil';

describe('POST /refresh-token', () => {
  setupIntegrationTests();
  test('should refresh token with valid refresh token in body', async () => {
    // Arrange
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
    };

    const user = await userModel.create({ ...userData, isVerified: true });

    // Generate valid tokens
    const accessToken = authUtil.generateAccessToken(user.id);
    const deviceId = 'test-device-id';
    const refreshToken = authUtil.generateRefreshToken(user.id, deviceId);

    // Store refresh token in Redis
    await authUtil.storeRefreshToken(user.id, deviceId, refreshToken);

    const refreshData = {
      userId: user.id,
      refreshToken: refreshToken,
    };

    // Act
    const response = await request(app).post('/api/v1/refresh-token').send(refreshData).expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.data.user.email).toBe('john@example.com');
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
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
    };

    const user = await userModel.create({ ...userData, isVerified: true });

    // Generate valid tokens
    const deviceId = 'test-device-id';
    const refreshToken = authUtil.generateRefreshToken(user.id, deviceId);

    // Store refresh token in Redis
    await authUtil.storeRefreshToken(user.id, deviceId, refreshToken);

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
    expect(response.body.data.user.email).toBe('john@example.com');
    expect(response.body.data.user.accessToken).toBeDefined();
    expect(response.body.data.user.refreshToken).toBeDefined();
    expect(response.body.data.user.refreshToken).not.toBe(refreshToken); // Should be rotated
  });

  test('should return 400 if refresh token is invalid', async () => {
    // Arrange
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
    };

    const user = await userModel.create({ ...userData, isVerified: true });

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
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123',
    };

    const user = await userModel.create({ ...userData, isVerified: true });

    // Generate valid token but don't store it in Redis
    const deviceId = 'test-device-id';
    const refreshToken = authUtil.generateRefreshToken(user.id, deviceId);

    const refreshData = {
      userId: user.id,
      refreshToken: refreshToken,
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

    // Store refresh token in Redis
    await authUtil.storeRefreshToken(nonExistentUserId, deviceId, refreshToken);

    const refreshData = {
      userId: nonExistentUserId,
      refreshToken: refreshToken,
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
