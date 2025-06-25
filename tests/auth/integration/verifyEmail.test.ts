import { jest, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import * as authUtil from '../../../src/util/authUtil';
import { setupUser } from '../../utils/userFactory'; // Import UserFactory

describe('POST /verify-email', () => {
  setupIntegrationTests();

  // Helper to setup user

  test('should verify user email, set user as verified in database, and send back auth tokens', async () => {
    // Arrange
    const { user, userData } = await setupUser({ isVerified: false });
    const verifyEmailOTP = '123456';

    jest.spyOn(authUtil, 'verifyOTP').mockResolvedValue(true);
    jest
      .spyOn(authUtil, 'login')
      .mockResolvedValue({ accessToken: 'accessToken', refreshToken: 'refreshToken' });

    // Act
    const response = await request(app)
      .post('/api/v1/verify-email')
      .send({ userId: user.id, verifyEmailOTP })
      .expect(200);

    // Assert
    expect(user.isVerified).toBeFalsy();
    expect(response.body.status).toBe('success');
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.user.accessToken).toBe('accessToken');
    expect(response.body.data.user.refreshToken).toBe('refreshToken');

    // Verify database state
    const userInDb = await userModel.findOne({ email: userData.email });
    expect(userInDb?.isVerified).toBeTruthy();
  });

  test('should return 400 if otp is incorrect', async () => {
    // Arrange
    const { user, userData } = await setupUser({ isVerified: false });
    const verifyEmailOTP = '123456';

    jest.spyOn(authUtil, 'verifyOTP').mockResolvedValue(false);
    jest.spyOn(authUtil, 'sendLoginResponse');

    // Act
    const response = await request(app)
      .post('/api/v1/verify-email')
      .send({ userId: user.id, verifyEmailOTP })
      .expect(400);

    // Assert
    expect(user.isVerified).toBeFalsy();
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('Invalid verification OTP');

    // Verify database state
    const userInDb = await userModel.findOne({ email: userData.email });
    expect(userInDb?.isVerified).toBeFalsy();
    expect(authUtil.sendLoginResponse).not.toHaveBeenCalled();
  });
});
