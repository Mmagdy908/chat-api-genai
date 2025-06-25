import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { verifyEmail } from '../../../src/controllers/authController';
import userModel from '../../../src/models/user';
import * as userMapper from '../../../src/mappers/userMapper';
import * as authService from '../../../src/services/authService';
import * as authUtil from '../../../src/util/authUtil';
import checkRequiredFields from '../../../src/util/checkRequiredFields';
import { Request, Response, NextFunction } from 'express';
import { mockedSendLoginResponseImplementation } from '../../utils/mocks';
import { userFactory } from '../../utils/userFactory';

jest.mock('../../../src/mappers/userMapper');
jest.mock('../../../src/services/authService');
jest.mock('../../../src/util/authUtil');
jest.mock('../../../src/util/checkRequiredFields');

describe('verify email controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = getMockReq({
      body: {
        userId: '123',
        verifyEmailOTP: '123456',
      },
    });
    ({ res, next } = getMockRes());
    next = jest.fn();
  });

  test('should verify user email and return 200 response with tokens', async () => {
    // Arrange
    const userData = userFactory.create();
    const userMock = new userModel(userData);

    const mappedResponse = {
      ...userMock.toObject(),
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    };

    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.verifyEmail).mockResolvedValue({
      user: userMock,
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    });
    jest.mocked(userMapper.mapLoginResponse).mockReturnValue(mappedResponse);
    jest
      .mocked(authUtil.sendLoginResponse)
      .mockImplementation(mockedSendLoginResponseImplementation);

    // Act
    await verifyEmail(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalledWith(req.body, 'userId', 'verifyEmailOTP');
    expect(authService.verifyEmail).toHaveBeenCalledWith(req.body.userId, req.body.verifyEmailOTP);
    expect(userMapper.mapLoginResponse).toHaveBeenCalledWith(
      userMock,
      'accessToken',
      'refreshToken'
    );
    expect(authUtil.sendLoginResponse).toHaveBeenCalledWith(res as Response, {
      user: userMock,
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { user: mappedResponse },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if required fields are missing', async () => {
    // Arrange
    delete req.body.userId;

    (checkRequiredFields as jest.Mock).mockImplementation(() => {
      throw new Error('Missing required field: userId');
    });

    // Act
    await verifyEmail(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalled();
    expect(authService.verifyEmail).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
