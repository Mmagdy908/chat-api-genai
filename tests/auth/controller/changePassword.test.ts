import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { changePassword } from '../../../src/controllers/authController';
import userModel from '../../../src/models/user';
import * as authService from '../../../src/services/authService';
import * as authUtil from '../../../src/util/authUtil';
import checkRequiredFields from '../../../src/util/checkRequiredFields';
import { Request, Response, NextFunction } from 'express';
import AppError from '../../../src/util/appError';
import { User } from '../../../src/interfaces/models/user';
import { mockedSendLoginResponseImplementation } from '../../utils/mocks';

jest.mock('../../../src/services/authService');
jest.mock('../../../src/util/authUtil');
jest.mock('../../../src/util/checkRequiredFields');

describe('changePassword controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = getMockReq({
      body: {
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      },
      user: new userModel({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'oldPassword123',
      }),
    });
    ({ res, next } = getMockRes());
    next = jest.fn();
  });

  test('should change password and return login response', async () => {
    // Arrange
    const userMock = req.user as User;
    const loggedUserData = {
      user: userMock,
      accessToken: 'newAccessToken',
      refreshToken: 'newRefreshToken',
    };

    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.updatePassword).mockResolvedValue(loggedUserData);
    jest
      .mocked(authUtil.sendLoginResponse)
      .mockImplementation(mockedSendLoginResponseImplementation);

    // Act
    await changePassword(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalledWith(req.body, 'oldPassword', 'newPassword');
    expect(authService.updatePassword).toHaveBeenCalledWith(
      userMock,
      'oldPassword123',
      'newPassword123'
    );
    expect(authUtil.sendLoginResponse).toHaveBeenCalledWith(res as Response, loggedUserData);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if required fields are missing', async () => {
    // Arrange
    (checkRequiredFields as jest.Mock).mockImplementation(() => {
      throw new Error('Missing required fields');
    });

    // Act
    await changePassword(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalled();
    expect(authService.updatePassword).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('should call next with error if service throws error', async () => {
    // Arrange
    const error = new AppError(400, 'Wrong old password');

    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.updatePassword).mockImplementation(() => {
      throw error;
    });

    // Act
    await changePassword(req as Request, res as Response, next);

    // Assert
    expect(authService.updatePassword).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });
});
