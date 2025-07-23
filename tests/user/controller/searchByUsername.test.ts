import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { getUser, searchByUsername } from '../../../src/controllers/http/userController';
import * as userService from '../../../src/services/userService';
import * as userSchema from '../../../src/schemas/userSchemas';
import { Request, Response, NextFunction } from 'express';
import { userFactory } from '../../utils/userFactory';
import { AppError } from '../../../src/util/appError';
import userModel from '../../../src/models/user';

jest.mock('../../../src/services/userService');
jest.mock('../../../src/schemas/userSchemas');

describe('searchByUsername controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ res, next } = getMockRes());
    next = jest.fn();
  });
  test('should fetch users by username and return success response', async () => {
    // Arrange
    const username = 'testuser';
    req = getMockReq({
      params: { username },
    });
    const users = [
      new userModel(userFactory.create({ username: 'testuser1', isVerified: true })),
      new userModel(userFactory.create({ username: 'testuser2', isVerified: true })),
    ];
    const mappedUsers = users.map((user) => ({ ...user, mapped: true }));
    jest.mocked(userService.searchByUsername).mockResolvedValue(users);
    jest
      .mocked(userSchema.mapGetResponse)
      .mockImplementation((user) => ({ ...user, mapped: true }));

    // Act
    await searchByUsername(req as Request, res as Response, next);

    // Assert
    expect(userService.searchByUsername).toHaveBeenCalledWith(username);
    expect(userSchema.mapGetResponse).toHaveBeenCalledTimes(users.length);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { users: mappedUsers },
      results: users.length,
      message: 'Users fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return empty array for no matching users', async () => {
    // Arrange
    const username = 'nonexistent';
    req = getMockReq({
      params: { username },
    });
    jest.mocked(userService.searchByUsername).mockResolvedValue([]);

    // Act
    await searchByUsername(req as Request, res as Response, next);

    // Assert
    expect(userService.searchByUsername).toHaveBeenCalledWith(username);
    expect(userSchema.mapGetResponse).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { users: [] },
      results: 0,
      message: 'Users fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
