import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { forgotPassword } from '../../../src/services/authService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as authUtil from '../../../src/util/authUtil';
import Email from '../../../src/util/email';
import userModel from '../../../src/models/user';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/util/authUtil');

describe('authService - forgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate OTP and send reset email for existing user', async () => {
    // Arrange
    const email = 'john@example.com';
    const userMock = new userModel({
      firstName: 'John',
      lastName: 'Doe',
      email: email,
      password: 'password123',
    });
    const resetOTP = '123456';

    jest.spyOn(userRepository, 'getByEmail').mockResolvedValue(userMock);
    jest.spyOn(authUtil, 'generateOTP').mockResolvedValue(resetOTP);
    jest.spyOn(authUtil, 'storeOTP').mockResolvedValue(undefined);
    jest.spyOn(Email.prototype, 'sendResetPasswordEmail').mockResolvedValue(undefined);

    // Act
    await forgotPassword(email);

    // Assert
    expect(userRepository.getByEmail).toHaveBeenCalledWith(email);
    expect(authUtil.generateOTP).toHaveBeenCalled();
    expect(authUtil.storeOTP).toHaveBeenCalledWith(userMock.id, 'resetOTP', resetOTP);
    expect(Email.prototype.sendResetPasswordEmail).toHaveBeenCalled();
  });

  test('should not throw error for non-existent user (prevent email enumeration)', async () => {
    // Arrange
    const email = 'nonexistent@example.com';

    jest.spyOn(userRepository, 'getByEmail').mockResolvedValue(null);
    jest.spyOn(authUtil, 'generateOTP');
    jest.spyOn(authUtil, 'storeOTP');
    jest.spyOn(Email.prototype, 'sendResetPasswordEmail');

    // Act
    await forgotPassword(email);

    // Assert
    expect(userRepository.getByEmail).toHaveBeenCalledWith(email);
    expect(authUtil.generateOTP).not.toHaveBeenCalled();
    expect(authUtil.storeOTP).not.toHaveBeenCalled();
    expect(Email.prototype.sendResetPasswordEmail).not.toHaveBeenCalled();
  });
});
