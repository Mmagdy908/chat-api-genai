import redis from '../config/redis';
import { User_Status } from '../enums/userEnums';

export const setOnlineSocket = async (userId: string, socketId: string) => {
  await redis.sAdd(`sockets:${userId}`, socketId);
};

export const removeOnlineSocket = async (userId: string, socketId: string) => {
  await redis.sRem(`sockets:${userId}`, socketId);
};

// export const getOnlineSockets = async (userId: string) => {
//   await redis.get(`sockets:${userId}`);
// };

export const setStatus = async (userId: string, status: User_Status) => {
  await redis.set(`presence:${userId}`, status);
};

export const getStatus = async (userId: string): Promise<User_Status> => {
  return ((await redis.get(`presence:${userId}`)) as User_Status) || User_Status.Offline;
};
