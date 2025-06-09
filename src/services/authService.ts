import { v4 as uuidv4 } from 'uuid';
import {
  generateAccessToken,
  verifyToken,
  generateRefreshToken,
  storeRefreshToken,
  retrieveRefreshToken,
  deleteAllRefreshTokens,
  generateOTP,
  storeOTP,
  verifyOTP,
} from '../util/authUtil';
import sendEmail from '../util/email';
import {
  generateResetPasswordEmailTemplate,
  generateVerifyEmailTemplate,
} from '../util/emailTemplate';
import { User } from '../interfaces/models/user';
import { LoginRequest } from '../interfaces/requests/user';
import * as userRepository from '../repositories/userRepository';

import AppError from '../util/appError';

const sendVerificationEmail = async (userEmail: string, verifyEmailOTP: string) => {
  await sendEmail(
    userEmail,
    'Verify Email OTP (valid for 10 mins)',
    generateVerifyEmailTemplate(verifyEmailOTP)
  );
};
export const userRegister = async (userData: Partial<User>): Promise<User> => {
  // 1) create user
  const user = await userRepository.create(userData);

  // 2) generate verify OTP
  const verifyEmailOTP = await generateOTP();

  await storeOTP(user.id, 'verifyOTP', verifyEmailOTP);

  // 3) send verification email
  await sendVerificationEmail(user.email, verifyEmailOTP);

  return user;
};

const login = async (userId: string): Promise<{ accessToken: string; refreshToken: string }> => {
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

export const verifyEmail = async (id: string, verifyEmailOTP: string) => {
  // 1) get user
  const user = await userRepository.getById(id);
  if (!user) throw new AppError(404, 'User Not Found');

  // 2) verify otp
  if (!(await verifyOTP(id, 'verifyOTP', verifyEmailOTP)))
    throw new AppError(400, 'Invalid verification OTP ');

  // 3) set user as verified
  const newUser = (await userRepository.updateById(id, { isVerified: true })) as User;

  // 4) login
  const { accessToken, refreshToken } = await login(id);

  return { user: newUser, accessToken, refreshToken };
};

export const userLogin = async (
  credentials: LoginRequest
): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  const { email, password } = credentials;

  // 1) Get user by email
  const user = await userRepository.getByEmail(email);

  // 2) check email and password
  if (!user || !(await user.checkPassword(password))) {
    throw new AppError(401, 'Incorrect email or password');
  }

  // 3) check if user is verified

  if (!user.isVerified) {
    //  generate verify OTP
    const verifyEmailOTP = await generateOTP();

    await storeOTP(user.id, 'verifyOTP', verifyEmailOTP);

    //  send verification email
    await sendVerificationEmail(user.email, verifyEmailOTP);

    throw new AppError(401, 'This email is not verified. An OTP is sent to your email');
  }

  // 4) login
  const { accessToken, refreshToken } = await login(user.id);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const refreshToken = async (
  userId: string,
  refreshToken: string
): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  // 1) verify access token
  const payload = await verifyToken(refreshToken);

  // 2) check if refresh token exists in redis
  const retrievedRefreshToken = await retrieveRefreshToken(userId, payload.deviceId);
  if (!retrievedRefreshToken || retrievedRefreshToken !== refreshToken) {
    throw new AppError(400, 'Invalid Refresh Token');
  }

  // 3) check user id
  if (userId !== payload.userId) throw new AppError(400, 'Invalid Refresh Token');

  // 4) check if user exists
  const user = await userRepository.getById(payload.userId, {
    path: 'workspaces',
    select: 'title',
  });
  if (!user) throw new AppError(400, 'User does not exist');

  // 5) generate access token
  const newAccessToken = generateAccessToken(userId);

  // 6) rotate refresh token
  const newRefreshToken = generateRefreshToken(userId, payload.deviceId);
  await storeRefreshToken(userId, payload.deviceId, newRefreshToken);

  return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const updatePassword = async (
  user: User,
  oldPassword: string,
  newPassword: string
): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  // 1) check old password
  if (!(await user.checkPassword(oldPassword))) throw new AppError(400, 'Wrong old password');

  // 2) check if new password equals old password
  if (oldPassword === newPassword)
    throw new AppError(400, "New password can't be the same as your current password");

  // 3) update password
  user.password = newPassword;
  const newUser = await userRepository.create(user);

  // 4) log out from all devices
  await deleteAllRefreshTokens(newUser.id);

  // 5) log in user
  const { accessToken, refreshToken } = await login(user.id);
  return { user: newUser, accessToken, refreshToken };
};

export const forgotPassword = async (email: string): Promise<void> => {
  // 1) get user
  const user = await userRepository.getByEmail(email);

  if (!user) return; // DO NOT throw error to prevent email leakage

  // 2) generate reset OTP
  const resetOTP = await generateOTP();

  await storeOTP(user.id, 'resetOTP', resetOTP);

  // 3) send email

  await sendEmail(
    user.email,
    'Reset Password OTP (valid for 10 mins)',
    generateResetPasswordEmailTemplate(resetOTP)
  );
};

export const resetPassword = async (
  email: string,
  resetOTP: string,
  newPassword: string
): Promise<void> => {
  // 1) get user
  const user = await userRepository.getByEmail(email);

  // 2) verify reset token

  if (!user || !(await verifyOTP(user?.id, 'resetOTP', resetOTP)))
    throw new AppError(400, 'Invalid reset password OTP ');

  // 3) reset password
  user.password = newPassword;
  user.passwordUpdatedAt = new Date();

  await userRepository.saveUser(user);

  // 4) log out from all devices
  await deleteAllRefreshTokens(user.id);
};
