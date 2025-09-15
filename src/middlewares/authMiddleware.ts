import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../util/authUtil';
import * as userRepository from '../repositories/userRepository';
import * as authService from '../services/authService';
import catchAsync from '../util/catchAsync';
import { AppError } from '../util/appError';

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // // 1) get access token
    // if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer'))
    //   return next(new AppError(401, 'You are not logged in'));

    // const accessToken = req.headers.authorization?.split(' ')[1] as string;
    // // 2) verify access token
    // const payload = await verifyToken(accessToken);

    // // 3) check if user exists
    // const user = await userRepository.getById(payload.userId);
    // if (!user) return next(new AppError(401, 'User does not exist'));

    // // 4) check if user changed password after token creation
    // if (user.passwordUpdatedAt && user.passwordUpdatedAt > payload.iat)
    //   throw new AppError(401, 'Invalid access token ');

    const user = await authService.isUserLoggedIn(req.headers.authorization);
    req.user = user;

    next();
  }
);
