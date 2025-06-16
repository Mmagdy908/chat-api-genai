import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { forgotPassword } from '../../../src/controllers/authController';
import * as authService from '../../../src/services/authService';
import checkRequiredFields from '../../../src/util/checkRequiredFields';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../../src/services/authService');
jest.mock('../../../src/util/checkRequiredFields');

describe('forgotPassword controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = getMockReq({
      body: {
        email: 'john@example.com',
      },
    });
    ({ res, next } = getMockRes());
    next = jest.fn();
  });

  test('should send forgot password email and return success response', async () => {
    // Arrange
    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.forgotPassword).mockResolvedValue(undefined);

    // Act
    await forgotPassword(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalledWith(req.body, 'email');
    expect(authService.forgotPassword).toHaveBeenCalledWith('john@example.com');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      message: 'A link is sent to your email',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if required fields are missing', async () => {
    // Arrange
    (checkRequiredFields as jest.Mock).mockImplementation(() => {
      throw new Error('Missing required field: email');
    });

    // Act
    await forgotPassword(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalled();
    expect(authService.forgotPassword).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
