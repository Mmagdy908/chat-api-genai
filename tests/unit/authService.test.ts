import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { userRegister } from '../../src/services/authService';
import * as userRepository from '../../src/repositories/userRepository';
import * as authUtil from '../../src/util/authUtil';
import Email from '../../src/util/email';
import { User } from '../../src/interfaces/models/user';
import user from '../../src/models/user';
// jest.mock('../../repositories/userRepository');
// jest.mock('../../services/otpService');
// jest.mock('../../services/emailService');

describe('authService - userRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register user and send verification email', async () => {
    // Arrange
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    };
    const createdUser = new user(userData);
    const verifyEmailOTP = '123456';

    jest.spyOn(userRepository, 'create').mockResolvedValue(createdUser);
    jest.spyOn(authUtil, 'generateOTP').mockResolvedValue(verifyEmailOTP);
    jest.spyOn(authUtil, 'storeOTP').mockResolvedValue(undefined);
    jest.spyOn(Email.prototype, 'sendVerificationEmail').mockResolvedValue(undefined);
    // jest.spyOn(authUtil, 'create').mockResolvedValue(createdUser as User);
    // (userRepository.create as jest.MockedFunction<typeof userRepository.create>).mockResolvedValue(
    //   createdUser as User
    // );
    // (otpService.generateOTP as jest.Mock).mockResolvedValue(verifyEmailOTP);
    // (otpService.storeOTP as jest.Mock).mockResolvedValue(undefined);
    // (emailService.sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

    // Act
    const result = await userRegister(userData);

    // Assert
    expect(userRepository.create).toHaveBeenCalledWith(userData);
    expect(authUtil.generateOTP).toHaveBeenCalled();
    expect(authUtil.storeOTP).toHaveBeenCalledWith(result.id, 'verifyOTP', '123456');
    expect(Email.prototype.sendVerificationEmail).toHaveBeenCalled();
    expect(result).toEqual(createdUser);
  });

  // test('should throw error if user creation fails', async () => {
  //   // Arrange
  //   const userData = {
  //     firstName: 'John',
  //     lastName: 'Doe',
  //     email: 'john@example.com',
  //     password: 'password123',
  //   };
  //   (userRepository.create as jest.Mock).mockRejectedValue(new Error('Email already exists'));

  //   // Act & Assert
  //   await expect(userRegister(userData)).rejects.toThrow('Email already exists');
  //   expect(otpService.generateOTP).not.toHaveBeenCalled();
  //   expect(otpService.storeOTP).not.toHaveBeenCalled();
  //   expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  // });
});
