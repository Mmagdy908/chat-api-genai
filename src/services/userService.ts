import * as friendshipRepository from '../repositories/friendshipRepository';

export const getUserFriends = async (userId: string): Promise<string[]> => {
  const friendships = await friendshipRepository.getAllByUser(userId);

  const friends = friendships.map((friendship) =>
    (friendship.sender.toString() === userId ? friendship.recipient : friendship.sender).toString()
  );

  return friends;
};
