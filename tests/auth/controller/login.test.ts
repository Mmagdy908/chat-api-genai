import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { login } from '../../../src/controllers/http/authController';
import userModel from '../../../src/models/user';
import * as userMapper from '../../../src/mappers/userMapper';
import * as authService from '../../../src/services/authService';
import * as authUtil from '../../../src/util/authUtil';
import checkRequiredFields from '../../../src/util/checkRequiredFields';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../src/util/appError';
import { mockedSendLoginResponseImplementation } from '../../utils/mocks';
import { MockUser, userFactory } from '../../utils/userFactory';

jest.mock('../../../src/mappers/userMapper');
jest.mock('../../../src/services/authService');
jest.mock('../../../src/util/authUtil');
jest.mock('../../../src/util/checkRequiredFields');

describe('login controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let userData: MockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    userData = userFactory.create({ isVerified: true });
    req = getMockReq({
      body: {
        email: userData.email,
        password: userData.password,
      },
    });
    ({ res, next } = getMockRes());
    next = jest.fn();
  });

  test('should login user and return 200 response with tokens', async () => {
    // Arrange
    const userMock = new userModel(userData);
    const mappedCredentials = { email: userMock.email, password: userMock.password };

    const loggedUserData = {
      user: userMock,
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    };

    const mappedResponse = {
      ...userMock.toObject(),
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    };

    (userMapper.mapLoginRequest as jest.Mock).mockReturnValue(mappedCredentials);
    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.userLogin).mockResolvedValue(loggedUserData);
    jest.mocked(authUtil.storeRefreshTokenToCookie).mockResolvedValue(undefined);
    jest.mocked(userMapper.mapLoginResponse).mockReturnValue(mappedResponse);
    jest
      .mocked(authUtil.sendLoginResponse)
      .mockImplementation(mockedSendLoginResponseImplementation);

    // Act
    await login(req as Request, res as Response, next);

    // Assert
    expect(userMapper.mapLoginRequest).toHaveBeenCalledWith(req.body);
    expect(checkRequiredFields).toHaveBeenCalledWith(mappedCredentials, 'email', 'password');
    expect(authService.userLogin).toHaveBeenCalledWith(mappedCredentials);
    expect(authUtil.storeRefreshTokenToCookie).toHaveBeenCalledWith(
      res as Response,
      'refreshToken'
    );
    expect(userMapper.mapLoginResponse).toHaveBeenCalledWith(
      userMock,
      'accessToken',
      'refreshToken'
    );
    expect(authUtil.sendLoginResponse).toHaveBeenCalledWith(res as Response, loggedUserData);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { user: mappedResponse },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if required fields are missing', async () => {
    // Arrange
    req.body = userFactory.createWithMissingFields('email');
    (userMapper.mapLoginRequest as jest.Mock).mockReturnValue(req.body);
    (checkRequiredFields as jest.Mock).mockImplementation(() => {
      throw new Error('Missing required field: email');
    });

    // Act
    await login(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalled();
    expect(authService.userLogin).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('should call next with error if login service throws error', async () => {
    // Arrange
    const userMock = new userModel(userData);
    const mappedCredentials = { email: userMock.email, password: userMock.password };
    (userMapper.mapLoginRequest as jest.Mock).mockReturnValue(mappedCredentials);
    (checkRequiredFields as jest.Mock).mockReturnValue(undefined);
    jest.mocked(authService.userLogin).mockImplementation(() => {
      throw new AppError(401, 'Incorrect email or password');
    });

    // Act
    await login(req as Request, res as Response, next);

    // Assert
    expect(userMapper.mapLoginRequest).toHaveBeenCalledWith(req.body);
    expect(checkRequiredFields).toHaveBeenCalledWith(mappedCredentials, 'email', 'password');
    expect(authService.userLogin).toHaveBeenCalledWith(mappedCredentials);
    expect(authUtil.storeRefreshTokenToCookie).not.toHaveBeenCalled();
    expect(authUtil.sendLoginResponse).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });
});
