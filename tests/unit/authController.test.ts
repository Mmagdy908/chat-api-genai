import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { register, verifyEmail, login, refreshToken } from '../../src/controllers/authController';
import userModel from '../../src/models/user';
import * as userMapper from '../../src/mappers/userMapper';
import * as authService from '../../src/services/authService';
import * as authUtil from '../../src/util/authUtil';
import checkRequiredFields from '../../src/util/checkRequiredFields';
import { Request, Response, NextFunction } from 'express';
import AppError from '../../src/util/appError';
import { User } from '../../src/interfaces/models/user';

const mockedSendLoginResponseImplementation = (
  res: Response,
  loggedUserData: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }
) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: userMapper.mapLoginResponse(
        loggedUserData.user,
        loggedUserData.accessToken,
        loggedUserData.refreshToken
      ),
    },
  });
};

jest.mock('../../src/mappers/userMapper');
jest.mock('../../src/services/authService');
jest.mock('../../src/util/authUtil');
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
    const userMock = new userModel({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    });

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
    (checkRequiredFields as jest.Mock).mockImplementation(() => {
      throw new Error('Missing required fields');
    });

    // Act
    await verifyEmail(req as Request, res as Response, next);

    // Assert
    expect(checkRequiredFields).toHaveBeenCalled();
    expect(authService.userRegister).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('login controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = getMockReq({
      body: {
        email: 'john@example.com',
        password: 'password123',
      },
    });
    ({ res, next } = getMockRes());

    next = jest.fn();
  });

  test('should login user and return 200 response with tokens', async () => {
    // Arrange
    const mappedCredentials = { ...req.body };
    const userMock = new userModel({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      isVerified: true,
    });

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
    const mappedCredentials = { ...req.body };

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
    const userMock = new userModel({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      isVerified: true,
    });

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
    req.body = { userId: 'user123' }; // No refreshToken in body
    req.cookies = { refreshToken: 'cookie-refresh-token' };

    const userMock = new userModel({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      isVerified: true,
    });

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
