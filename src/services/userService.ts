import { User } from '../interfaces/models/user';
import * as userRepository from '../repositories/userRepository';
import * as friendshipRepository from '../repositories/friendshipRepository';
import * as userSchema from '../schemas/userSchemas';
import { AppError } from '../util/appError';
import user from '../models/user';

export const getUser = async (id: string): Promise<User | null> => {
  const user = await userRepository.getVerifiedById(id);

  if (!user) throw new AppError(404, 'User not found');

  return user;
};

export const searchByUsername = async (username: string): Promise<User[]> => {
  return await userRepository.searchByUsername(username);
};

export const updateMe = async (
  userId: string,
  userData: userSchema.UpdateMeRequest
): Promise<User | null> => {
  return await userRepository.updateById(userId, userData);
};

export const getUserFriends = async (userId: string): Promise<string[]> => {
  const friendships = await friendshipRepository.getAllByUser(userId);

  const friends = friendships.map((friendship) =>
    (friendship.sender.toString() === userId ? friendship.recipient : friendship.sender).toString()
  );

  return friends;
};
