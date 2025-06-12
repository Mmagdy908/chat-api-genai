import redis from '../config/redis';

export const setField = async (key: string, value: any) => {
  await redis.hSet(key, value);
};

export const setExpiryDate = async (key: string, expiryDate: number) => {
  await redis.expire(key, expiryDate);
};

export const getField = async (key: string, field: string) => {
  return await redis.hGet(key, field);
};

export const deleteField = async (key: string, field: string) => {
  await redis.hDel(key, field);
};

export const deleteAllFieldsWithPattern = async (pattern: string, field: string) => {
  const keys = await redis.keys(pattern);
  await Promise.all(keys.map((key) => redis.hDel(key, field)));
};
