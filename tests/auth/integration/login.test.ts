import { jest, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import * as authUtil from '../../../src/util/authUtil';
import Email from '../../../src/util/email';
import { userFactory } from '../../utils/userFactory';
jest.mock('../../../src/util/email');

describe('POST /login', () => {
  setupIntegrationTests();

  test('should login user with correct credentials and return tokens', async () => {
    // Arrange
    const userData = userFactory.create({ isVerified: true });
    await userModel.create(userData);

    const loginData = {
      email: userData.email,
      password: userData.password,
    };

    // Act
    const response = await request(app).post('/api/v1/login').send(loginData).expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.user.accessToken).toBeDefined();
    expect(response.body.data.user.refreshToken).toBeDefined();
    expect(response.body.data.user.password).toBeUndefined();

    // Verify refresh token cookie is set
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=');
  });

  test('should return 401 if email does not exist', async () => {
    // Arrange
    const loginData = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    // Act
    const response = await request(app).post('/api/v1/login').send(loginData).expect(401);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Incorrect email or password');
  });

  test('should return 401 if password is incorrect', async () => {
    // Arrange
    const userData = userFactory.create({ isVerified: true });
    await userModel.create(userData);

    const loginData = {
      email: userData.email,
      password: 'wrongpassword',
    };

    // Act
    const response = await request(app).post('/api/v1/login').send(loginData).expect(401);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Incorrect email or password');
  });

  test('should return 401 and resend verification email if user is not verified', async () => {
    // Arrange
    const userData = userFactory.create({ isVerified: false });
    await userModel.create(userData);

    const loginData = {
      email: userData.email,
      password: userData.password,
    };

    const verifyEmailOTP = '123456';

    jest.spyOn(authUtil, 'generateOTP').mockResolvedValue(verifyEmailOTP);
    jest.spyOn(authUtil, 'storeOTP');
    jest.mocked(Email.prototype.sendVerificationEmail);

    // Act
    const response = await request(app).post('/api/v1/login').send(loginData).expect(401);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain(
      'This email is not verified. An OTP is sent to your email'
    );

    // Verify OTP and email calls
    expect(authUtil.generateOTP).toHaveBeenCalled();
    expect(authUtil.storeOTP).toHaveBeenCalledWith(expect.any(String), 'verifyOTP', verifyEmailOTP);
    expect(Email.prototype.sendVerificationEmail).toHaveBeenCalled();
  });

  test('should return 400 if required fields are missing', async () => {
    // Arrange
    const loginData = { email: 'john@example.com' }; // missing password

    // Act
    const response = await request(app).post('/api/v1/login').send(loginData).expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Missing required field: password');
  });
});
