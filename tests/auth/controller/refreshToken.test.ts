import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { refreshToken } from '../../../src/controllers/authController';
import userModel from '../../../src/models/user';
import * as userMapper from '../../../src/mappers/userMapper';
import * as authService from '../../../src/services/authService';
import * as authUtil from '../../../src/util/authUtil';
import checkRequiredFields from '../../../src/util/checkRequiredFields';
import { Request, Response, NextFunction } from 'express';
import AppError from '../../../src/util/appError';
import { mockedSendLoginResponseImplementation } from '../../utils/mocks';
import { userFactory } from '../../utils/userFactory';

jest.mock('../../../src/mappers/userMapper');
jest.mock('../../../src/services/authService');
jest.mock('../../../src/util/authUtil');
jest.mock('../../../src/util/checkRequiredFields');

describe('refreshToken controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = getMockReq({
      body: {
        userId: 'user123',
        refreshToken: 'valid-refresh-token',
      },
      cookies: {},
    });
    ({ res, next } = getMockRes());
    next = jest.fn();
  });

  test('should refresh token and return 200 response with new tokens', async () => {
    // Arrange
    const userData = userFactory.create({ isVerified: true });
    const userMock = new userModel(userData);

    const loggedUserData = {
      user: userMock,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    const mappedResponse = {
      ...userMock.toObject(),
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.refreshToken).mockResolvedValue(loggedUserData);
    jest.mocked(authUtil.storeRefreshTokenToCookie).mockResolvedValue(undefined);
    jest.mocked(userMapper.mapLoginResponse).mockReturnValue(mappedResponse);
    jest
      .mocked(authUtil.sendLoginResponse)
      .mockImplementation(mockedSendLoginResponseImplementation);

    // Act
    await refreshToken(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalledWith(req.body, 'userId', 'refreshToken');
    expect(authService.refreshToken).toHaveBeenCalledWith(req.body.userId, req.body.refreshToken);
    expect(authUtil.storeRefreshTokenToCookie).toHaveBeenCalledWith(
      res as Response,
      'new-refresh-token'
    );
    expect(userMapper.mapLoginResponse).toHaveBeenCalledWith(
      userMock,
      'new-access-token',
      'new-refresh-token'
    );
    expect(authUtil.sendLoginResponse).toHaveBeenCalledWith(res as Response, loggedUserData);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { user: mappedResponse },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should use refresh token from cookies if not in body', async () => {
    // Arrange
    req.body = { userId: 'user123' };
    req.cookies = { refreshToken: 'cookie-refresh-token' };

    const userData = userFactory.create({ isVerified: true });
    const userMock = new userModel(userData);

    const loggedUserData = {
      user: userMock,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    const mappedResponse = {
      ...userMock.toObject(),
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.refreshToken).mockResolvedValue(loggedUserData);
    jest.mocked(authUtil.storeRefreshTokenToCookie).mockResolvedValue(undefined);
    jest.mocked(userMapper.mapLoginResponse).mockReturnValue(mappedResponse);
    jest
      .mocked(authUtil.sendLoginResponse)
      .mockImplementation(mockedSendLoginResponseImplementation);

    // Act
    await refreshToken(req as Request, res as Response, next);

    // Assert
    expect(req.body.refreshToken).toBe('cookie-refresh-token');
    expect(checkRequiredFields).toHaveBeenCalledWith(req.body, 'userId', 'refreshToken');
    expect(authService.refreshToken).toHaveBeenCalledWith('user123', 'cookie-refresh-token');
    expect(authUtil.storeRefreshTokenToCookie).toHaveBeenCalledWith(
      res as Response,
      'new-refresh-token'
    );
    expect(authUtil.sendLoginResponse).toHaveBeenCalledWith(res as Response, loggedUserData);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if required fields are missing', async () => {
    // Arrange
    req.body = { refreshToken: 'valid-refresh-token' };
    (checkRequiredFields as jest.Mock).mockImplementation(() => {
      throw new Error('Missing required field: userId');
    });

    // Act
    await refreshToken(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalled();
    expect(authService.refreshToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('should call next with error if refresh token service throws error', async () => {
    // Arrange
    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.refreshToken).mockImplementation(() => {
      throw new AppError(400, 'Invalid Refresh Token');
    });

    // Act
    await refreshToken(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalledWith(req.body, 'userId', 'refreshToken');
    expect(authService.refreshToken).toHaveBeenCalledWith(req.body.userId, req.body.refreshToken);
    expect(authUtil.storeRefreshTokenToCookie).not.toHaveBeenCalled();
    expect(authUtil.sendLoginResponse).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });
});
