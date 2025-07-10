import redis from '../config/redis';
import { User_Status } from '../enums/userEnums';

export const setOnlineSocket = async (userId: string, socketId: string) => {
  await redis.sAdd(`sockets:${userId}`, socketId);
};

export const removeOnlineSocket = async (userId: string, socketId: string) => {
  await redis.sRem(`sockets:${userId}`, socketId);
};

export const getOnlineSocketsCount = async (userId: string): Promise<number> => {
  return await redis.sCard(`sockets:${userId}`);
};

export const setStatus = async (userId: string, status: User_Status) => {
  await redis.hSet(`presence:${userId}`, { status, lastActive: Date.now() });
};

export const getStatus = async (
  userId: string
): Promise<{ status: User_Status; lastActive: Date }> => {
  const { status, lastActive } = await redis.hGetAll(`presence:${userId}`);

  return {
    status: (status as User_Status) || User_Status.Offline,
    lastActive: new Date(parseInt(lastActive) || Date.now()),
  };
};

export const updateKeyExpiration = async (userId: string, seconds: number) => {
  await redis.set(`heartbeat:${userId}`, '', { EX: seconds });
};
