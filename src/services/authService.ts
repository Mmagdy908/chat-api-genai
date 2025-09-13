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
  login,
} from '../util/authUtil';
import Email from '../util/email';

import { User } from '../interfaces/models/user';
import { LoginRequest } from '../interfaces/requests/user';
import * as userRepository from '../repositories/userRepository';

import { AppError } from '../util/appError';

export const userRegister = async (userData: Partial<User>): Promise<User> => {
  // 1) create user
  const user = await userRepository.create(userData);

  // 2) generate verify OTP
  const verifyEmailOTP = await generateOTP();

  await storeOTP(user.id.toString(), 'verifyOTP', verifyEmailOTP);

  // 3) send verification email
  await new Email(user, verifyEmailOTP).sendVerificationEmail();

  return user;
};

export const verifyEmail = async (id: string, verifyEmailOTP: string) => {
  // 1) get user
  const user = await userRepository.getById(id);
  if (!user) throw new AppError(404, 'User Not Found');

  // 2) verify otp
  if (!(await verifyOTP(id, 'verifyOTP', verifyEmailOTP)))
    throw new AppError(400, 'Invalid verification OTP');

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

    await storeOTP(user.id.toString(), 'verifyOTP', verifyEmailOTP);

    //  send verification email
    await new Email(user, verifyEmailOTP).sendVerificationEmail();

    throw new AppError(401, 'This email is not verified. An OTP is sent to your email');
  }

  // 4) login
  const { accessToken, refreshToken } = await login(user.id.toString());

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const isUserLoggedIn = async (token?: string): Promise<User> => {
  // 1) get access token
  if (!token || !token.startsWith('Bearer')) throw new AppError(401, 'You are not logged in');

  const accessToken = token?.split(' ')[1] as string;

  // 2) verify access token
  const payload = await verifyToken(accessToken);

  // 3) check if user exists
  const user = await userRepository.getById(payload.userId);
  if (!user) throw new AppError(401, 'User does not exist');

  // 4) check if user changed password after token creation
  if (user.passwordUpdatedAt && user.passwordUpdatedAt > payload.iat)
    throw new AppError(401, 'Invalid access token ');

  return user;
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
  const user = await userRepository.getVerifiedById(payload.userId);

  if (!user) throw new AppError(404, 'User does not exist');

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
  user.passwordUpdatedAt = new Date();

  const newUser = await userRepository.create(user);

  // 4) log out from all devices
  await deleteAllRefreshTokens(newUser.id.toString());

  // 5) log in user
  const { accessToken, refreshToken } = await login(user.id.toString());
  return { user: newUser, accessToken, refreshToken };
};

export const forgotPassword = async (email: string): Promise<void> => {
  // 1) get user
  const user = await userRepository.getByEmail(email);

  if (!user || !user.isVerified) return; // DO NOT throw error to prevent email leakage

  // 2) generate reset OTP
  const resetOTP = await generateOTP();

  await storeOTP(user.id.toString(), 'resetOTP', resetOTP);

  // 3) send email

  await new Email(user, resetOTP).sendResetPasswordEmail();
};

export const resetPassword = async (
  email: string,
  resetOTP: string,
  newPassword: string
): Promise<void> => {
  // 1) get user
  const user = await userRepository.getByEmail(email);

  // 2) verify reset token

  if (!user || !(await verifyOTP(user?.id.toString(), 'resetOTP', resetOTP)))
    throw new AppError(400, 'Invalid reset password OTP ');

  // 3) reset password
  user.password = newPassword;
  user.passwordUpdatedAt = new Date();

  await userRepository.saveUser(user);

  // 4) log out from all devices
  await deleteAllRefreshTokens(user.id.toString());
};
