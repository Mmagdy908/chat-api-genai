import JWT, { Secret, SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction, CookieOptions } from 'express';
import redis from '../config/redis';
import { User } from '../interfaces/models/user';
import * as userMapper from '../mappers/userMapper';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import appError from './appError';

export const generateAccessToken = (userId: string) => {
  const secret: Secret = process.env.JWT_SECRET || '';

  const signOptions = { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN } as SignOptions;

  return JWT.sign({ userId }, secret, signOptions);
};

export const generateRefreshToken = (userId: string, deviceId: string) => {
  const secret: Secret = process.env.JWT_SECRET || '';

  const signOptions = { expiresIn: process.env.Refresh_TOKEN_EXPIRES_IN } as SignOptions;

  return JWT.sign({ userId, deviceId }, secret, signOptions);
};

export const storeRefreshToken = async (userId: string, deviceId: string, refreshToken: string) => {
  await redis.hSet(`${userId}:${deviceId}`, { refreshToken });

  const expireAt = parseInt(process.env.Refresh_TOKEN_EXPIRES_IN?.slice(0, -1) || '30'); // in days

  await redis.expire(`${userId}:${deviceId}`, expireAt * 24 * 60 * 60);
};

export const retrieveRefreshToken = async (userId: string, deviceId: string): Promise<string> => {
  return (await redis.hGet(`${userId}:${deviceId}`, 'refreshToken')) || '';
};

export const deleteRefreshToken = async (userId: string, deviceId: string): Promise<void> => {
  await redis.hDel(`${userId}:${deviceId}`, 'refreshToken');
};

export const deleteAllRefreshTokens = async (userId: string): Promise<void> => {
  const keys = await redis.keys(`${userId}:*`);
  await Promise.all(keys.map((key) => redis.hDel(key, 'refreshToken')));
};

export const generateOTP = async (): Promise<string> => {
  const resetOTP = `${crypto.randomInt(100000, 999999)}`;
  return resetOTP;
};

export const storeOTP = async (userId: string, type: 'verifyOTP' | 'resetOTP', OTP: string) => {
  const hash = await bcrypt.hash(OTP, Number(process.env.SALT));

  await redis.hSet(userId, { [type]: hash });

  const expiresAt = Number(process.env.PASSWORD_RESET_OTP_EXPIRES_AT?.slice(0, -1)); // in mins

  await redis.expire(userId, expiresAt * 60);
};

export const verifyOTP = async (userId: string, type: 'verifyOTP' | 'resetOTP', OTP: string) => {
  const hash = await redis.hGet(userId, type);

  if (!hash || !(await bcrypt.compare(OTP, hash))) return false;

  await redis.hDel(userId, type);

  return true;
};

export const storeRefreshTokenToCookie = async (
  res: Response,
  refreshToken: string
): Promise<void> => {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '30') * 24 * 60 * 60 * 1000,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'none';
  }

  res.cookie('refreshToken', refreshToken, cookieOptions);
};

const asyncJwtVerify = (token: string, secretOrPublicKey: Secret): Promise<any> => {
  return new Promise((resolve: (value: unknown) => void, reject: (reason?: any) => void) => {
    JWT.verify(token, secretOrPublicKey, function (err, payload) {
      if (err) reject(err);
      resolve(payload);
    });
  });
};

export const verifyToken = async (token: string): Promise<any> => {
  const secret: Secret = process.env.JWT_SECRET as string;
  const payload = await asyncJwtVerify(token, secret);
  return payload;
};

export const sendLoginResponse = (
  res: Response,
  loggedUserData: { user: User; accessToken: string; refreshToken: string }
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
