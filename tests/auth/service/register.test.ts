import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { userRegister } from '../../../src/services/authService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as authUtil from '../../../src/util/authUtil';
import Email from '../../../src/util/email';
import userModel from '../../../src/models/user';
import AppError from '../../../src/util/appError';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/util/authUtil');

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
    const createdUser = new userModel(userData);
    const verifyEmailOTP = '123456';

    // ## alternative way for mocking
    // const mockedUserRepository = jest.mocked(userRepository);
    // mockedUserRepository.create.mockResolvedValue(createdUser);

    jest.spyOn(userRepository, 'create').mockResolvedValue(createdUser);
    jest.spyOn(authUtil, 'generateOTP').mockResolvedValue(verifyEmailOTP);
    jest.spyOn(authUtil, 'storeOTP').mockResolvedValue(undefined);
    jest.spyOn(Email.prototype, 'sendVerificationEmail').mockResolvedValue(undefined);

    // Act
    const result = await userRegister(userData);

    // Assert
    expect(userRepository.create).toHaveBeenCalledWith(userData);
    expect(authUtil.generateOTP).toHaveBeenCalled();
    expect(authUtil.storeOTP).toHaveBeenCalledWith(result.id, 'verifyOTP', '123456');
    expect(Email.prototype.sendVerificationEmail).toHaveBeenCalled();
    expect(result).toEqual(createdUser);
  });

  test('should throw error if user creation fails', async () => {
    // Arrange
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    jest
      .spyOn(userRepository, 'create')
      .mockRejectedValue(new AppError(400, 'Email already exists'));

    // Act & Assert
    await expect(userRegister(userData)).rejects.toThrow('Email already exists');
    expect(authUtil.generateOTP).not.toHaveBeenCalled();
    expect(authUtil.storeOTP).not.toHaveBeenCalled();
    expect(Email.prototype.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
