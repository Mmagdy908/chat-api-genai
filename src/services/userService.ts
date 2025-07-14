import { User } from '../interfaces/models/user';
import * as userRepository from '../repositories/userRepository';
import * as friendshipRepository from '../repositories/friendshipRepository';
import * as userSchema from '../schemas/userSchemas';

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
