import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { register } from '../../src/controllers/authController';
import userModel from '../../src/models/user';
import * as userMapper from '../../src/mappers/userMapper';
import * as authService from '../../src/services/authService';
import checkRequiredFields from '../../src/util/checkRequiredFields';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../src/mappers/userMapper');
jest.mock('../../src/services/authService');
jest.mock('../../src/util/checkRequiredFields');

describe('register controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = getMockReq({
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      },
    });
    ({ res, next } = getMockRes());

    next = jest.fn();
  });

  test('should register user and return 201 response', async () => {
    // Arrange
    const mappedBody = { ...req.body };
    const createdUser = new userModel(mappedBody);
    const mappedResponse = { id: createdUser.id, email: createdUser.email };

    (userMapper.mapRegisterRequest as jest.Mock).mockReturnValue(mappedBody);
    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.userRegister).mockResolvedValue(createdUser);
    (userMapper.mapRegisterResponse as jest.Mock).mockReturnValue(mappedResponse);

    // Act
    await register(req as Request, res as Response, next);

    // Assert
    expect(userMapper.mapRegisterRequest).toHaveBeenCalledWith(req.body);
    expect(checkRequiredFields).toHaveBeenCalledWith(
      mappedBody,
      'firstName',
      'lastName',
      'email',
      'password'
    );
    expect(authService.userRegister).toHaveBeenCalledWith(mappedBody);
    expect(userMapper.mapRegisterResponse).toHaveBeenCalledWith(createdUser);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { user: mappedResponse },
      message: 'Please verify your email',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if required fields are missing', async () => {
    // Arrange
    (userMapper.mapRegisterRequest as jest.Mock).mockReturnValue(req.body);
    (checkRequiredFields as jest.Mock).mockImplementation(() => {
      throw new Error('Missing required fields');
    });

    // Act
    await register(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalled();
    expect(authService.userRegister).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
