import { toObjectId } from '../util/objectIdUtil';
import * as userRepository from '../repositories/userRepository';
import * as friendshipRepository from '../repositories/friendshipRepository';
import * as chatRepository from '../repositories/chatRepository';
import * as userChatRepository from '../repositories/userChatRepository';
import { AppError } from '../util/appError';
import { Friendship_Status } from '../enums/friendshipEnums';
import { notificationProducer } from '../kafka/producer';
import { Notification_Type, Reference_Type } from '../enums/notificationEnums';
import { SendNotificationRequest } from '../schemas/notificationSchemas';

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

  // send notification to recipient
  const notificationData: SendNotificationRequest = {
    type: Notification_Type.Received_Friend_Request,
    sender: senderId,
    recipient: recipientId,
    reference: friendship.id,
    referenceType: Reference_Type.Friendship,
  };

  await notificationProducer(notificationData);

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

  //  in case of acceptance
  if (status === Friendship_Status.Accepted) {
    // create new chat between sender and recipient
    const chat = await chatRepository.createPrivateChat([
      friendship.sender.toString(),
      friendship.recipient.toString(),
    ]);

    await userChatRepository.create(friendship.sender.toString(), chat.id);
    await userChatRepository.create(friendship.recipient.toString(), chat.id);

    // send notification to sender
    const notificationData: SendNotificationRequest = {
      type: Notification_Type.Accepted_Friend_Request,
      sender: recipientId,
      recipient: friendship.sender.toString(),
      reference: friendship.id,
      referenceType: Reference_Type.Friendship,
    };

    await notificationProducer(notificationData);
  }

  return newFriendship;
};
