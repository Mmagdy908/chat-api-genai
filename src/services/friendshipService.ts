import { toObjectId } from '../util/objectIdUtil';
import * as userRepository from '../repositories/userRepository';
import * as friendshipRepository from '../repositories/friendshipRepository';
import * as chatRepository from '../repositories/chatRepository';

import AppError from '../util/appError';
import { Friendship_Status } from '../enums/friendshipEnums';

export const send = async (senderId: string, recipientId: string) => {
  if (senderId === recipientId)
    throw new AppError(400, 'You cannot send a friend request to yourself');

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

export const respond = async (id: string, recipientId: string, status: Friendship_Status) => {
  const friendship = await friendshipRepository.getById(id);

  if (!friendship) throw new AppError(404, 'This friendship is not found');

  if (friendship.recipient.toString() !== recipientId)
    throw new AppError(403, 'Current user is not recipient of this friend request');

  if (friendship.status !== Friendship_Status.Pending)
    throw new AppError(400, 'This friendship is not Pending');

  // respond to friendship Request
  const newFriendship = await friendshipRepository.updateById(id, { status });

  //TODO send notification to sender in case of acceptance

  // create new chat between sender and recipient in case of acceptance
  if (status === Friendship_Status.Accepted)
    await chatRepository.createPrivateChat([
      friendship.sender.toString(),
      friendship.recipient.toString(),
    ]);

  return newFriendship;
};
