import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { getUser } from '../../../src/controllers/http/userController';
import * as userService from '../../../src/services/userService';
import * as userSchema from '../../../src/schemas/userSchemas';
import { Request, Response, NextFunction } from 'express';
import { userFactory } from '../../utils/userFactory';
import { AppError } from '../../../src/util/appError';
import userModel from '../../../src/models/user';

jest.mock('../../../src/services/userService');
jest.mock('../../../src/schemas/userSchemas');

describe('getUser controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ res, next } = getMockRes());
    next = jest.fn();
  });
  test('should fetch user and return success response', async () => {
    // Arrange
    const userData = new userModel(userFactory.create({ isVerified: true }));
    req = getMockReq({
      params: { id: userData.id },
    });
    const mappedUser = { ...userData, mapped: true };
    jest.mocked(userService.getUser).mockResolvedValue(userData);
    jest.mocked(userSchema.mapGetResponse).mockReturnValue(mappedUser);

    // Act
    await getUser(req as Request, res as Response, next);

    // Assert
    expect(userService.getUser).toHaveBeenCalledWith(userData.id);
    expect(userSchema.mapGetResponse).toHaveBeenCalledWith(userData);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { user: mappedUser },
      message: 'User is fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if user is not found', async () => {
    // Arrange
    req = getMockReq({
      params: { id: 'nonexistent-id' },
    });
    const error = new AppError(404, 'User not found');
    jest.mocked(userService.getUser).mockImplementation(() => {
      throw error;
    });

    // Act
    await getUser(req as Request, res as Response, next);

    // Assert
    expect(userService.getUser).toHaveBeenCalledWith('nonexistent-id');
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });
});
