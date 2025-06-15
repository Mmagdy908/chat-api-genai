import { jest, describe, expect, test, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { mongoConfig, disconnectMongoDB, clearMongoDB } from '../../src/config/mongo';
import { redisConfig, clearRedis, disconnectRedis } from '../../src/config/redis';
import userModel from '../../src/models/user';
import * as authUtil from '../../src/util/authUtil';
import Email from '../../src/util/email';
jest.mock('../../src/util/email');

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await mongoConfig(); // Start in-memory MongoDB
    await redisConfig();
  });

  beforeEach(async () => {
    await clearMongoDB(); // Reset database
    await clearRedis();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectMongoDB(); // Stop MongoDB
    await disconnectRedis();
  });

  describe('POST /register', () => {
    test('should register user, save to database, and trigger OTP/email', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };
      const verifyEmailOTP = '123456';

      jest.spyOn(authUtil, 'generateOTP').mockResolvedValue(verifyEmailOTP);
      jest.spyOn(authUtil, 'storeOTP');
      jest.mocked(Email.prototype.sendVerificationEmail);

      // Act
      const response = await request(app).post('/api/v1/register').send(userData).expect(201);

      // Assert
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('john@example.com');
      expect(response.body.message).toBe('Please verify your email');
      expect(response.body.data.user.password).toBeUndefined();

      // Verify database state
      const userInDb = await userModel.findOne({ email: 'john@example.com' });
      expect(userInDb).toBeTruthy();
      expect(userInDb?.firstName).toBe('John');

      // Verify OTP and email calls
      expect(authUtil.generateOTP).toHaveBeenCalled();
      expect(authUtil.storeOTP).toHaveBeenCalledWith(
        expect.any(String),
        'verifyOTP',
        verifyEmailOTP
      );
      expect(Email.prototype.sendVerificationEmail).toHaveBeenCalled();
    });

    test('should return 400 if email is already registered', async () => {
      // Arrange
      await userModel.create({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john@example.com',
        password: '123456789',
      });
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };
      // Act
      const response = await request(app).post('/api/v1/register').send(userData).expect(400);
      // Assert
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('This email already exists');
      // Verify no OTP/email calls
      expect(authUtil.generateOTP).not.toHaveBeenCalled();
      expect(authUtil.storeOTP).not.toHaveBeenCalled();
      expect(Email.prototype.sendVerificationEmail).not.toHaveBeenCalled();
    });

    test('should return 400 if required fields are missing', async () => {
      // Arrange
      const userData = { email: 'john@example.com', password: 'password123' };

      // Act
      const response = await request(app).post('/api/v1/register').send(userData).expect(400);

      // Assert
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Missing required field: firstName');

      // Verify database state
      const users = await userModel.find();
      expect(users).toHaveLength(0);
    });
  });

  describe('POST /verify-email', () => {
    test('should verify user email, set user as verified in database, and send back auth tokens', async () => {
      // Arrange
      const userMock = await userModel.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });
      const verifyEmailOTP = '123456';

      jest.spyOn(authUtil, 'verifyOTP').mockResolvedValue(true);
      jest
        .spyOn(authUtil, 'login')
        .mockResolvedValue({ accessToken: 'accessToken', refreshToken: 'refreshToken' });

      // Act
      const response = await request(app)
        .post('/api/v1/verify-email')
        .send({ userId: userMock.id, verifyEmailOTP })
        .expect(200);

      // Assert
      expect(userMock?.isVerified).toBeFalsy();
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('john@example.com');
      expect(response.body.data.user.accessToken).toBe('accessToken');
      expect(response.body.data.user.refreshToken).toBe('refreshToken');

      // Verify database state
      const userInDb = await userModel.findOne({ email: 'john@example.com' });
      expect(userInDb?.isVerified).toBeTruthy();
    });

    test('should return 400 if otp is incorrect', async () => {
      // Arrange
      const userMock = await userModel.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });
      const verifyEmailOTP = '123456';

      jest.spyOn(authUtil, 'verifyOTP').mockResolvedValue(false);
      jest.spyOn(authUtil, 'sendLoginResponse');

      // Act
      const response = await request(app)
        .post('/api/v1/verify-email')
        .send({ userId: userMock.id, verifyEmailOTP })
        .expect(400);

      // Assert
      expect(userMock?.isVerified).toBeFalsy();
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Invalid verification OTP');

      // Verify database state
      const userInDb = await userModel.findOne({ email: 'john@example.com' });
      expect(userInDb?.isVerified).toBeFalsy();
      expect(authUtil.sendLoginResponse).not.toHaveBeenCalled();
    });
  });

  describe('POST /login', () => {
    test('should login user with correct credentials and return tokens', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      // Create and verify user first
      await userModel.create({ ...userData, isVerified: true });

      const loginData = {
        email: 'john@example.com',
        password: 'password123',
      };

      // Act
      const response = await request(app).post('/api/v1/login').send(loginData).expect(200);

      // Assert
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('john@example.com');
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
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      await userModel.create({ ...userData, isVerified: true });

      const loginData = {
        email: 'john@example.com',
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
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      await userModel.create({ ...userData, isVerified: false });

      const loginData = {
        email: 'john@example.com',
        password: 'password123',
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
      expect(authUtil.storeOTP).toHaveBeenCalledWith(
        expect.any(String),
        'verifyOTP',
        verifyEmailOTP
      );
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

  describe('POST /refresh-token', () => {
    test('should refresh token with valid refresh token in body', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
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
      const response = await request(app)
        .post('/api/v1/refresh-token')
        .send(refreshData)
        .expect(200);

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
        email: 'john@example.com',
        password: 'password123',
      };

      const user = await userModel.create({ ...userData, isVerified: true });

      const refreshData = {
        userId: user.id,
        refreshToken: authUtil.generateRefreshToken(user.id, 'test-device-id'),
      };

      // Act
      const response = await request(app)
        .post('/api/v1/refresh-token')
        .send(refreshData)
        .expect(400);

      // Assert
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Invalid Refresh Token');
    });

    test('should return 400 if refresh token does not exist in Redis', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
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
      const response = await request(app)
        .post('/api/v1/refresh-token')
        .send(refreshData)
        .expect(400);

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
      const response = await request(app)
        .post('/api/v1/refresh-token')
        .send(refreshData)
        .expect(400);

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
      const response = await request(app)
        .post('/api/v1/refresh-token')
        .send(refreshData)
        .expect(400);

      // Assert
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Missing required field: userId');
    });
  });
});
