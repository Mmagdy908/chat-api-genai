import { Send } from 'express';
import { Message } from '../interfaces/models/message';
import messageModel from '../models/message';
import {
  GetMessageResponse,
  SendGenaiMessageRequest,
  SendMessageRequest,
  SendMessageResponse,
} from '../schemas/messageSchemas';
import { toObjectId } from '../util/objectIdUtil';

export const create = async (
  messageData: SendMessageRequest | SendGenaiMessageRequest
): Promise<SendMessageResponse> => {
  const message = await messageModel.create(messageData);
  return await message.populate({
    path: 'sender',
    select: 'firstName lastName photo',
  });
};

export const getAllByChat = async (
  chatId: string,
  limit?: string,
  before?: string
): Promise<GetMessageResponse[]> => {
  const query = messageModel
    .find({ chat: chatId })
    .sort('-_id')
    .limit(parseInt(limit || ''))
    .populate({
      path: 'sender',
      select: 'firstName lastName photo',
    });

  if (before) query.find({ _id: { $lt: toObjectId(before) } });

  return (await query) as GetMessageResponse[];
};

export const getById = async (id: string): Promise<Message | null> => {
  return await messageModel.findById(id);
};

export const appendMessage = async (id: string, append: string) => {
  // return await messageModel.findById(id);
  return await messageModel.updateOne({ _id: id }, [
    {
      $set: { 'content.text': { $concat: ['$content.text', append] } },
    },
  ]);
};

export const getUnreadMessagesCount = async (
  userId: string,
  chatId: string,
  lastSeenMessage?: string
): Promise<number> => {
  const query = messageModel.find({ chat: chatId, sender: { $ne: userId } });

  if (lastSeenMessage) query.find({ _id: { $gt: toObjectId(lastSeenMessage) } });

  return (await query).length;
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
