import { jest, describe, expect, test, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { mongoConfig, disconnectMongoDB, clearMongoDB } from '../../src/config/mongo';
import User from '../../src/models/user';
import * as authUtil from '../../src/util/authUtil';
import Email from '../../src/util/email';

jest.mock('../../src/util/authUtil');
jest.mock('../../src/util/email');

describe('Register API Integration Tests', () => {
  beforeAll(async () => {
    await mongoConfig(); // Start in-memory MongoDB
  });

  beforeEach(async () => {
    await clearMongoDB(); // Reset database
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectMongoDB(); // Stop MongoDB
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

      jest.mocked(authUtil.generateOTP).mockResolvedValue(verifyEmailOTP);
      jest.mocked(authUtil.storeOTP).mockResolvedValue(undefined);
      jest.mocked(Email.prototype.sendVerificationEmail).mockResolvedValue(undefined);

      // Act
      const response = await request(app).post('/api/v1/register').send(userData).expect(201);

      // Assert
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('john@example.com');
      expect(response.body.message).toBe('Please verify your email');
      expect(response.body.data.user.password).toBeUndefined();

      // Verify database state
      const userInDb = await User.findOne({ email: 'john@example.com' });
      expect(userInDb).toBeTruthy();
      expect(userInDb?.firstName).toBe('John');

      // Verify OTP and email calls
      expect(authUtil.generateOTP).toHaveBeenCalled();
      expect(authUtil.storeOTP).toHaveBeenCalledWith(expect.any(String), 'verifyOTP', '123456');
      expect(Email.prototype.sendVerificationEmail).toHaveBeenCalled();
    });

    test('should return 400 if email is already registered', async () => {
      // Arrange
      await User.create({
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
      const users = await User.find();
      expect(users).toHaveLength(0);
    });
  });
});
