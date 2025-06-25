import { toObjectId } from '../util/objectIdUtil';
import * as userRepository from '../repositories/userRepository';
import * as friendshipRepository from '../repositories/friendshipRepository';
import AppError from '../util/appError';

export const createFriendRequest = async (senderId: string, recipientId: string) => {
  const recipient = await userRepository.getById(recipientId);

  if (!recipient) throw new AppError(404, 'This recipient is not found');

  if (await friendshipRepository.getBySenderRecipientId(senderId, recipientId))
    throw new AppError(400, 'This Friendship already exists');

  const friendship = await friendshipRepository.create({
    sender: toObjectId(senderId),
    recipient: toObjectId(recipientId),
  });

  //TODO send notification to recipient

  return friendship;
};
