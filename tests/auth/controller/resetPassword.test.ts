import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { resetPassword } from '../../../src/controllers/authController';
import * as authService from '../../../src/services/authService';
import checkRequiredFields from '../../../src/util/checkRequiredFields';
import { Request, Response, NextFunction } from 'express';
import AppError from '../../../src/util/appError';
import { userFactory } from '../../utils/userFactory';

jest.mock('../../../src/services/authService');
jest.mock('../../../src/util/checkRequiredFields');

describe('resetPassword controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    const userData = userFactory.create();
    req = getMockReq({
      body: {
        email: userData.email,
        resetOTP: '123456',
        newPassword: 'newPassword123',
      },
    });
    ({ res, next } = getMockRes());
    next = jest.fn();
  });

  test('should reset password and return success response', async () => {
    // Arrange
    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.resetPassword).mockResolvedValue(undefined);

    // Act
    await resetPassword(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalledWith(req.body, 'email', 'resetOTP', 'newPassword');
    expect(authService.resetPassword).toHaveBeenCalledWith(
      req.body.email,
      '123456',
      'newPassword123'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      message: 'Password is reset successfuly. Please Log in',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if required fields are missing', async () => {
    // Arrange
    delete req.body.newPassword;

    (checkRequiredFields as jest.Mock).mockImplementation(() => {
      throw new Error('Missing required field: newPassword');
    });

    // Act
    await resetPassword(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalled();
    expect(authService.resetPassword).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('should call next with error if service throws error', async () => {
    // Arrange
    const error = new AppError(400, 'Invalid reset password OTP');
    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.resetPassword).mockImplementation(() => {
      throw error;
    });

    // Act
    await resetPassword(req as Request, res as Response, next);

    // Assert
    expect(authService.resetPassword).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });
});
