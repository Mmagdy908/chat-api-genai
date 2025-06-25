import { jest, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import * as authUtil from '../../../src/util/authUtil';
import Email from '../../../src/util/email';
import { userFactory } from '../../utils/userFactory'; // Import UserFactory

jest.mock('../../../src/util/email');

describe('POST /register', () => {
  setupIntegrationTests();

  test('should register user, save to database, and trigger OTP/email', async () => {
    // Arrange
    const userData = userFactory.create();
    const verifyEmailOTP = '123456';

    jest.spyOn(authUtil, 'generateOTP').mockResolvedValue(verifyEmailOTP);
    jest.spyOn(authUtil, 'storeOTP');
    jest.mocked(Email.prototype.sendVerificationEmail);

    // Act
    const response = await request(app).post('/api/v1/register').send(userData).expect(201);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.data.user.username).toBe(userData.username);
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.message).toBe('Please verify your email');
    expect(response.body.data.user.password).toBeUndefined();

    // Verify database state
    const userInDb = await userModel.findOne({ email: userData.email });
    expect(userInDb).toBeTruthy();
    expect(userInDb?.firstName).toBe(userData.firstName);

    // Verify OTP and email calls
    expect(authUtil.generateOTP).toHaveBeenCalled();
    expect(authUtil.storeOTP).toHaveBeenCalledWith(expect.any(String), 'verifyOTP', verifyEmailOTP);
    expect(Email.prototype.sendVerificationEmail).toHaveBeenCalled();
  });

  test('should return 400 if email is already registered', async () => {
    // Arrange
    const existingUserData = userFactory.create({
      email: 'ahmedmohamed@example.com',
      username: 'ahmedmohamed',
    });
    await userModel.create(existingUserData);

    const userData = userFactory.create({
      email: 'ahmedmohamed@example.com',
      username: 'ahmed_mohamed', // Different username to avoid username conflict
    });

    jest.spyOn(authUtil, 'generateOTP');
    jest.spyOn(authUtil, 'storeOTP');
    jest.mocked(Email.prototype.sendVerificationEmail);

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
    const userData = userFactory.createWithMissingFields('firstName');

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
