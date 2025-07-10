import { User_Status } from '../enums/userEnums';
import { User } from '../interfaces/models/user';
import * as userStatusRepository from '../repositories/userStatusRepository';

export const addOnlineSocket = async (userId: string, socketId: string) => {
  await userStatusRepository.setOnlineSocket(userId, socketId);
};

export const removeOnlineSocket = async (userId: string, socketId: string) => {
  return await userStatusRepository.removeOnlineSocket(userId, socketId);
};

export const getOnlineSocketsCount = async (userId: string): Promise<number> => {
  return await userStatusRepository.getOnlineSocketsCount(userId);
};

export const setUserStatus = async (userId: string, status: User_Status) => {
  await userStatusRepository.setStatus(userId, status);
};

export const getUserStatus = async (
  userId: string
): Promise<{ status: User_Status; lastActive: Date }> => {
  return await userStatusRepository.getStatus(userId);
};

export const updateHeartbeatKey = async (userId: string, seconds: number) => {
  await userStatusRepository.updateKeyExpiration(userId, seconds);
};
