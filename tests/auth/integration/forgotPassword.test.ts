import { jest, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import * as authUtil from '../../../src/util/authUtil';
import Email from '../../../src/util/email';
import { userFactory } from '../../utils/userFactory';
jest.mock('../../../src/util/email');

describe('POST /forgot-password', () => {
  setupIntegrationTests();

  test('should send reset password email for existing user', async () => {
    // Arrange
    const userData = userFactory.create({ isVerified: true });
    await userModel.create(userData);

    const resetOTP = '123456';

    jest.spyOn(authUtil, 'generateOTP').mockResolvedValue(resetOTP);
    jest.spyOn(authUtil, 'storeOTP').mockResolvedValue(undefined);
    jest.spyOn(Email.prototype, 'sendResetPasswordEmail').mockResolvedValue(undefined);

    // Act
    const response = await request(app)
      .post('/api/v1/forgot-password')
      .send({ email: userData.email })
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('A link is sent to your email');

    // Verify OTP generation and email sending
    expect(authUtil.generateOTP).toHaveBeenCalled();
    expect(authUtil.storeOTP).toHaveBeenCalledWith(expect.any(String), 'resetOTP', resetOTP);
    expect(Email.prototype.sendResetPasswordEmail).toHaveBeenCalled();
  });

  test('should return success even for non-existent user (prevent email leakage)', async () => {
    // Arrange
    jest.spyOn(authUtil, 'generateOTP');
    jest.spyOn(authUtil, 'storeOTP');
    jest.spyOn(Email.prototype, 'sendResetPasswordEmail');

    // Act
    const response = await request(app)
      .post('/api/v1/forgot-password')
      .send({ email: 'nonexistent@example.com' })
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('A link is sent to your email');

    // Verify no OTP or email operations
    expect(authUtil.generateOTP).not.toHaveBeenCalled();
    expect(authUtil.storeOTP).not.toHaveBeenCalled();
    expect(Email.prototype.sendResetPasswordEmail).not.toHaveBeenCalled();
  });

  test('should return 400 if email is missing', async () => {
    // Act
    const response = await request(app).post('/api/v1/forgot-password').send({}).expect(400);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Missing required field: email');
  });
});
