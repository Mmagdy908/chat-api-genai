import { jest, describe, expect, test } from '@jest/globals';
import { searchByUsername } from '../../../src/services/userService';
import * as userRepository from '../../../src/repositories/userRepository';
import { userFactory } from '../../utils/userFactory';
import userModel from '../../../src/models/user';

describe('userService - searchByUsername', () => {
  test('should return users matching username', async () => {
    // Arrange
    const username = 'testuser';
    const users = [
      new userModel(userFactory.create({ username: 'testuser1', isVerified: true })),
      new userModel(userFactory.create({ username: 'testuser2', isVerified: true })),
    ];
    jest.spyOn(userRepository, 'searchByUsername').mockResolvedValue(users);

    // Act
    const result = await searchByUsername(username);

    // Assert
    expect(userRepository.searchByUsername).toHaveBeenCalledWith(username);
    expect(result).toEqual(users);
  });

  test('should return empty array for no matching users', async () => {
    // Arrange
    const username = 'nonexistent';
    jest.spyOn(userRepository, 'searchByUsername').mockResolvedValue([]);

    // Act
    const result = await searchByUsername(username);

    // Assert
    expect(userRepository.searchByUsername).toHaveBeenCalledWith(username);
    expect(result).toEqual([]);
  });
});
