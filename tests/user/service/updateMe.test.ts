import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { updateMe } from '../../../src/services/userService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as userSchema from '../../../src/schemas/userSchemas';
import { userFactory } from '../../utils/userFactory';
import { UpdateMeRequest } from '../../../src/schemas/userSchemas';
import { User } from '../../../src/interfaces/models/user';
import userModel from '../../../src/models/user';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/schemas/userSchemas');

describe('userService - updateMe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('should update user data and return updated user', async () => {
    // Arrange
    const userData = userFactory.create();
    const user = new userModel(userData);
    const updateData: UpdateMeRequest = {
      firstName: 'Updated Name',
      photo: 'https://example.com/photo.jpg',
    };
    const updatedUser = { ...userData, ...updateData } as User;

    jest.spyOn(userRepository, 'updateById').mockResolvedValue(updatedUser);

    // Act
    const result = await updateMe(user.id, updateData);

    // Assert
    expect(userRepository.updateById).toHaveBeenCalledWith(user.id, updateData);
    expect(result).toEqual(updatedUser);
  });

  test('should return null if user not found', async () => {
    // Arrange
    const userId = 'nonexistent-id';
    const updateData: UpdateMeRequest = { firstName: 'Updated Name' };

    jest.spyOn(userRepository, 'updateById').mockResolvedValue(null);

    // Act
    const result = await updateMe(userId, updateData);

    // Assert
    expect(userRepository.updateById).toHaveBeenCalledWith(userId, updateData);
    expect(result).toBeNull();
  });
});
