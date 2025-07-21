import { ParsedQs } from 'qs';
import * as userRepository from '../repositories/userRepository';
import * as chatRepository from '../repositories/chatRepository';
import * as userChatRepository from '../repositories/userChatRepository';
import { toObjectId } from '../util/objectIdUtil';
import { AppError } from '../util/appError';
import { CreateGroupChatRequest, GetChatResponse } from '../schemas/chatSchemas';

export const join = async (userId: string, chatId: string) => {
  const chat = await chatRepository.getById(chatId);

  if (!chat) throw new AppError(404, 'Chat not found');

  if (!chat.members.includes(toObjectId(userId)))
    throw new AppError(403, 'User is not a member of this chat');
};

export const createGroup = async (groupChatData: CreateGroupChatRequest) => {
  groupChatData.members ||= [];

  if (!groupChatData.members.includes(groupChatData.owner))
    groupChatData.members.push(groupChatData.owner);

  const members = await Promise.all(
    groupChatData.members
      .filter((member) => member !== groupChatData.owner)
      .map((member) => userRepository.getById(member))
  );

  if (members.some((member) => !member)) throw new AppError(404, 'Some members are not found');

  const chat = await chatRepository.createGroupChat(groupChatData);

  await userChatRepository.create(groupChatData.owner, chat.id);

  return chat;
};

export const getAllChatsByMember = async (
  userId: string,
  options?: {
    before?: number;
    limit?: number;
    selectedFields?: string;
  }
): Promise<GetChatResponse[]> => {
  return await chatRepository.getAllChatsByMember(userId, {
    ...options,
    populateOptions: [
      { path: 'members', select: 'firstName lastName photo' },
      { path: 'lastMessage', populate: 'sender' },
    ],
  });
};
