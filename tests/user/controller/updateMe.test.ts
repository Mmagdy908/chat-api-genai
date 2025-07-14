import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { updateMe } from '../../../src/controllers/http/userController';
import * as userService from '../../../src/services/userService';
import * as userSchema from '../../../src/schemas/userSchemas';
import { Request, Response, NextFunction } from 'express';
import { userFactory } from '../../utils/userFactory';
import { UpdateMeRequest } from '../../../src/schemas/userSchemas';
import userModel from '../../../src/models/user';
import { User } from '../../../src/interfaces/models/user';

jest.mock('../../../src/services/userService');
jest.mock('../../../src/schemas/userSchemas');

describe('updateMe controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    const userData = userFactory.create();
    const user = new userModel(userData);
    req = getMockReq({
      body: {
        name: 'Updated Name',
        photo: 'https://example.com/photo.jpg',
      },
      user: { id: user.id },
      file: { path: 'temp/photo.jpg' },
      url: 'https://example.com/photo.jpg',
    });
    ({ res, next } = getMockRes());
    next = jest.fn();
  });

  test('should update user and return success response', async () => {
    // Arrange
    const userData = userFactory.create();
    const updateData: UpdateMeRequest = {
      firstName: 'Updated Name',
      photo: 'https://example.com/photo.jpg',
    };
    const updatedUser = { ...userData, ...updateData } as User;

    jest.spyOn(userSchema, 'mapToUpdateMeRequest').mockReturnValue(updateData);
    jest.spyOn(userService, 'updateMe').mockResolvedValue(updatedUser);
    jest.spyOn(userSchema, 'mapToUpdateMeResponse').mockReturnValue(updatedUser);

    // Act
    await updateMe(req as Request, res as Response, next);

    // Assert
    expect(userSchema.mapToUpdateMeRequest).toHaveBeenCalledWith(req.body);
    expect(userService.updateMe).toHaveBeenCalledWith(req.user?.id as string, updateData);
    expect(userSchema.mapToUpdateMeResponse).toHaveBeenCalledWith(updatedUser);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { user: updatedUser },
      message: 'User updated successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if service throws error', async () => {
    // Arrange
    const userData = userFactory.create();
    const updateData: UpdateMeRequest = {
      firstName: 'Updated Name',
      photo: 'https://example.com/photo.jpg',
    };
    const updatedUser = { ...userData, ...updateData } as User;

    jest.spyOn(userSchema, 'mapToUpdateMeRequest').mockReturnValue(updateData);
    jest.spyOn(userService, 'updateMe').mockImplementation(() => {
      throw new Error();
    });
    jest.spyOn(userSchema, 'mapToUpdateMeResponse').mockReturnValue(updatedUser);

    // Act
    await updateMe(req as Request, res as Response, next);

    // Assert
    expect(userService.updateMe).toHaveBeenCalledWith(req.user?.id as string, updateData);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
