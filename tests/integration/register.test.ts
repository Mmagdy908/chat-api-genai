import { jest, describe, expect, test, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { mongoConfig, disconnectMongoDB, clearMongoDB } from '../../src/config/mongo';
import { redisConfig, disconnectRedis } from '../../src/config/redis';
import userModel from '../../src/models/user';
import * as authUtil from '../../src/util/authUtil';
import Email from '../../src/util/email';

jest.mock('../../src/util/authUtil');
jest.mock('../../src/util/email');

describe('Register API Integration Tests', () => {
  describe('POST /register', () => {
    beforeAll(async () => {
      await mongoConfig(); // Start in-memory MongoDB
      await redisConfig();
    });

    beforeEach(async () => {
      await userModel.deleteMany(); // Reset database
      jest.clearAllMocks();
    });

    afterAll(async () => {
      await disconnectMongoDB(); // Stop MongoDB
      await disconnectRedis();
    });
    test('should register user, save to database, and trigger OTP/email', async () => {
      // Arrange
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };
      const verifyEmailOTP = '123456';

      jest.mocked(authUtil.generateOTP).mockResolvedValue(verifyEmailOTP);
      jest.mocked(authUtil.storeOTP);
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
});

describe('Verify Email API Integration Tests', () => {
  describe('POST /verify-email', () => {
    beforeAll(async () => {
      await mongoConfig(); // Start in-memory MongoDB
      await redisConfig();
    });

    beforeEach(async () => {
      await userModel.deleteMany(); // Reset database
      jest.clearAllMocks();
    });

    afterAll(async () => {
      await disconnectMongoDB(); // Stop MongoDB
      await disconnectRedis();
    });

    test('should verify user email, set user as verified in database, and send back auth tokens', async () => {
      // Arrange
      const userMock = await userModel.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });
      const verifyEmailOTP = '123456';

      jest.mocked(authUtil.verifyOTP).mockResolvedValue(true);
      jest
        .mocked(authUtil.login)
        .mockResolvedValue({ accessToken: 'accessToken', refreshToken: 'refreshToken' });

      jest.mocked(authUtil.sendLoginResponse).mockImplementation((res, loggedUserData) => {
        res.status(200).json({
          status: 'success',
          data: {
            user: {
              ...userMock.toObject(),
              accessToken: 'accessToken',
              refreshToken: 'refreshToken',
            },
          },
        });
      });

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

      jest.mocked(authUtil.verifyOTP).mockResolvedValue(false);

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
});
