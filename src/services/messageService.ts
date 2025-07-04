import { Message } from '../interfaces/models/message';
import * as messageRepository from '../repositories/messageRepository';
import * as chatRepository from '../repositories/chatRepository';
import { toObjectId } from '../util/objectIdUtil';
import { AppError } from '../util/appError';
import z from 'zod/v4';
import { SendMessageRequest, SendMessageResponse } from '../schemas/messageSchemas';

export const send = async (messageData: SendMessageRequest): Promise<SendMessageResponse> => {
  // get chat
  const chat = await chatRepository.getById(messageData.chat.toString(), {
    path: 'lastMessage',
    select: 'createdAt',
  });

  // check if chat exists
  if (!chat) throw new AppError(404, 'Chat not found');

  // check if sender is a member in chat
  if (!chat.members.includes(toObjectId(messageData.sender)))
    throw new AppError(403, 'User is not a member of this chat');

  // create message
  const message = await messageRepository.create(messageData);

  // update last message in chat
  const chatLastMessage = chat.lastMessage as Message;

  if (!chatLastMessage || chatLastMessage.createdAt < message.createdAt) {
    await chatRepository.updateById(message.chat.toString(), {
      lastMessage: toObjectId(message.id),
    });
  }

  return message;
};
