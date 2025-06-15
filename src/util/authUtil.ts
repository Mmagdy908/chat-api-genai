import JWT, { Secret, SignOptions } from 'jsonwebtoken';
import { Response, CookieOptions } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../interfaces/models/user';
import * as userMapper from '../mappers/userMapper';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import * as redis from './redisUtil';
import ENV_VAR from '../config/envConfig';

export const generateAccessToken = (userId: string) => {
  const secret: Secret = ENV_VAR.JWT_SECRET;

  const signOptions = { expiresIn: ENV_VAR.ACCESS_TOKEN_EXPIRES_IN } as SignOptions;

  return JWT.sign({ userId, uid: uuidv4() }, secret, signOptions);
};

export const generateRefreshToken = (userId: string, deviceId: string) => {
  const secret: Secret = ENV_VAR.JWT_SECRET;

  const signOptions = { expiresIn: ENV_VAR.REFRESH_TOKEN_EXPIRES_IN } as SignOptions;

  return JWT.sign({ userId, deviceId, uid: uuidv4() }, secret, signOptions);
};

export const storeRefreshToken = async (userId: string, deviceId: string, refreshToken: string) => {
  await redis.setField(`${userId}:${deviceId}`, { refreshToken });

  const expireAt = parseInt(ENV_VAR.REFRESH_TOKEN_EXPIRES_IN?.slice(0, -1) || '30'); // in days

  await redis.setExpiryDate(`${userId}:${deviceId}`, expireAt * 24 * 60 * 60);
};

export const retrieveRefreshToken = async (userId: string, deviceId: string): Promise<string> => {
  return (await redis.getField(`${userId}:${deviceId}`, 'refreshToken')) as string;
};

export const deleteRefreshToken = async (userId: string, deviceId: string): Promise<void> => {
  await redis.deleteField(`${userId}:${deviceId}`, 'refreshToken');
};

export const deleteAllRefreshTokens = async (userId: string): Promise<void> => {
  await redis.deleteAllFieldsWithPattern(`${userId}:*`, 'refreshToken');
};

export const generateOTP = async (): Promise<string> => {
  const resetOTP = `${crypto.randomInt(100000, 999999)}`;
  return resetOTP;
};

export const storeOTP = async (userId: string, type: 'verifyOTP' | 'resetOTP', OTP: string) => {
  const hash = await bcrypt.hash(OTP, Number(ENV_VAR.SALT));

  await redis.setField(userId, { [type]: hash });

  const expiresAt = Number(ENV_VAR.PASSWORD_RESET_OTP_EXPIRES_AT?.slice(0, -1)); // in mins

  await redis.setExpiryDate(userId, expiresAt * 60);
};

export const verifyOTP = async (userId: string, type: 'verifyOTP' | 'resetOTP', OTP: string) => {
  const hash = await redis.getField(userId, type);

  if (!hash || !(await bcrypt.compare(OTP, hash))) return false;

  await redis.deleteField(userId, type);

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
    maxAge: parseInt(ENV_VAR.JWT_COOKIE_EXPIRES_IN || '30') * 24 * 60 * 60 * 1000,
  };

  if (ENV_VAR.NODE_ENV === 'production') {
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
  const secret: Secret = ENV_VAR.JWT_SECRET as string;
  const payload = await asyncJwtVerify(token, secret);
  return payload;
};

export const login = async (
  userId: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  // 1) generate access token
  const accessToken = generateAccessToken(userId);

  // 2) generate refresh token
  const deviceId = uuidv4();
  const refreshToken = generateRefreshToken(userId, deviceId);

  // 3) save refresh token to redis
  await storeRefreshToken(userId, deviceId, refreshToken);

  return {
    accessToken,
    refreshToken,
  };
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
