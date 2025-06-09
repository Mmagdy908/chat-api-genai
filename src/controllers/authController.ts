import { Request, Response, NextFunction } from 'express';
import { storeRefreshTokenToCookie, sendLoginResponse } from '../util/authUtil';
import catchAsync from '../util/catchAsync';
import * as authService from '../services/authService';
import * as userMapper from '../mappers/userMapper';
import checkRequiredFields from '../util/checkRequiredFields';
import user from '../models/user';

export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const body = userMapper.mapRegisterRequest(req.body);

    checkRequiredFields(body, 'firstName', 'lastName', 'email', 'password');

    const user = userMapper.mapRegisterResponse(await authService.userRegister(body));

    res
      .status(201)
      .json({ status: 'success', data: { user }, message: 'Please verify your email' });
  }
);

export const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  checkRequiredFields(req.body, 'userId', 'verifyEmailOTP');

  const loggedUserData = await authService.verifyEmail(req.body.userId, req.body.verifyEmailOTP);

  sendLoginResponse(res, loggedUserData);
});

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const credentials = userMapper.mapLoginRequest(req.body);

    checkRequiredFields(credentials, 'email', 'password');

    const loggedUserData = await authService.userLogin(credentials);

    storeRefreshTokenToCookie(res, loggedUserData.refreshToken);

    sendLoginResponse(res, loggedUserData);
  }
);

export const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.body.refreshToken ||= req.cookies.refreshToken;

    checkRequiredFields(req.body, 'userId', 'refreshToken');

    const loggedUserData = await authService.refreshToken(req.body.userId, req.body.refreshToken);

    storeRefreshTokenToCookie(res, loggedUserData.refreshToken);

    sendLoginResponse(res, loggedUserData);
  }
);

export const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    checkRequiredFields(req.body, 'oldPassword', 'newPassword');
    const { oldPassword, newPassword } = req.body;
    const loggedUserData = await authService.updatePassword(req.user, oldPassword, newPassword);

    sendLoginResponse(res, loggedUserData);
  }
);

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    checkRequiredFields(req.body, 'email');

    await authService.forgotPassword(req.body.email);
    res.status(200).json({
      status: 'success',
      message: 'A link is sent to your email',
    });
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    checkRequiredFields(req.body, 'email', 'resetOTP', 'newPassword');

    const { email, resetOTP, newPassword } = req.body;

    await authService.resetPassword(email, resetOTP, newPassword);

    res.status(200).json({
      status: 'success',
      message: 'Password is reset successfuly. Please Log in',
    });
  }
);
