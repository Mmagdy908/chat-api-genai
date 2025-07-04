import { Send } from 'express';
import { Message } from '../interfaces/models/message';
import messageModel from '../models/message';
import { SendMessageRequest, SendMessageResponse } from '../schemas/messageSchemas';

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
