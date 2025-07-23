import { jest, describe, expect, test } from '@jest/globals';
import { getUser } from '../../../src/services/userService';
import * as userRepository from '../../../src/repositories/userRepository';
import { userFactory } from '../../utils/userFactory';
import userModel from '../../../src/models/user';
import { AppError } from '../../../src/util/appError';

describe('userService - getUser', () => {
  test('should return user for existing verified user', async () => {
    // Arrange
    const user = new userModel(userFactory.create({ isVerified: true }));
    jest.spyOn(userRepository, 'getVerifiedById').mockResolvedValue(user);

    // Act
    const result = await getUser(user.id);

    // Assert
    expect(userRepository.getVerifiedById).toHaveBeenCalledWith(user.id);
    expect(result).toEqual(user);
  });

  test('should throw error for non-existent user', async () => {
    // Arrange
    const id = 'nonexistent-id';
    jest.spyOn(userRepository, 'getVerifiedById').mockResolvedValue(null);

    // Act & Assert
    await expect(getUser(id)).rejects.toThrow(new AppError(404, 'User not found'));
    expect(userRepository.getVerifiedById).toHaveBeenCalledWith(id);
  });
});
