import * as chatRepository from '../repositories/chatRepository';
import { toObjectId } from '../util/objectIdUtil';
import { AppError } from '../util/appError';

export const join = async (userId: string, chatId: string) => {
  const chat = await chatRepository.getById(chatId);

  if (!chat) throw new AppError(404, 'Chat not found');

  if (!chat.members.includes(toObjectId(userId)))
    throw new AppError(403, 'User is not a member of this chat');
};
