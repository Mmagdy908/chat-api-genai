import { Send } from 'express';
import { Message } from '../interfaces/models/message';
import messageModel from '../models/message';
import { SendMessageRequest, SendMessageResponse } from '../schemas/messageSchemas';
import { toObjectId } from '../util/objectIdUtil';

export const create = async (messageData: SendMessageRequest): Promise<SendMessageResponse> => {
  const message = await messageModel.create(messageData);
  return await message.populate({
    path: 'sender',
    select: 'firstName lastName photo',
  });
};

export const getById = async (id: string): Promise<Message | null> => {
  return await messageModel.findById(id);
};

export const updateById = async (
  id: string,
  messageData: Partial<Message>
): Promise<Message | null> => {
  return await messageModel.findByIdAndUpdate(id, messageData, { new: true });
};

export const markMessagesAsDelivered = async (
  userId: string,
  chatIds: string[],
  lastDeliveredMessages: string | undefined[]
) => {
  await Promise.all(
    chatIds.map((chatId, ind) => {
      const filter = {
        chat: toObjectId(chatId),
        sender: { $ne: toObjectId(userId) },
      };

      if (lastDeliveredMessages[ind])
        (filter as any)._id = { $gt: toObjectId(lastDeliveredMessages[ind]) };

      return messageModel.updateMany(filter, { $addToSet: { deliveredTo: userId } });
    })
  );

  return await Promise.all(
    chatIds.map((chatId, ind) => {
      const filter = {
        chat: toObjectId(chatId),
        sender: { $ne: toObjectId(userId) },
      };

      if (lastDeliveredMessages[ind])
        (filter as any)._id = { $gt: toObjectId(lastDeliveredMessages[ind]) };

      return messageModel.find(filter).sort('_id');
    })
  );
};

export const markMessagesAsSeen = async (
  userId: string,
  chatId: string,
  lastSeenMessage: string | undefined
) => {
  const filter = {
    chat: toObjectId(chatId),
    sender: { $ne: toObjectId(userId) },
  };

  if (lastSeenMessage) (filter as any)._id = { $gt: toObjectId(lastSeenMessage) };

  await messageModel.updateMany(filter, { $addToSet: { seenBy: userId } });

  return await messageModel.find(filter).sort('_id');
};
