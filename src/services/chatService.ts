import * as userRepository from '../repositories/userRepository';
import * as chatRepository from '../repositories/chatRepository';
import * as userChatRepository from '../repositories/userChatRepository';
import { toObjectId } from '../util/objectIdUtil';
import { AppError } from '../util/appError';
import { CreateGroupChatRequest, GetChatResponse } from '../schemas/chatSchemas';
import { Chat } from '../interfaces/models/chat';
import user from '../models/user';

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

  await Promise.all(
    groupChatData.members.map((member) => userChatRepository.create(member, chat.id))
  );

  return chat;
};

export const addGroupMember = async (memberId: string, chat: Chat) => {
  const member = await userRepository.getVerifiedById(memberId);

  if (!member) throw new AppError(404, 'User not found');

  if (chat.members.includes(toObjectId(memberId)))
    throw new AppError(400, 'User is already a member of this chat');

  const updatedChat = await chatRepository.addGroupChatMember(memberId, chat.id);

  await userChatRepository.create(memberId, chat.id);

  return updatedChat;
};

export const addGroupAdmin = async (adminId: string, chat: Chat) => {
  const admin = await userRepository.getVerifiedById(adminId);

  if (!admin) throw new AppError(404, 'User not found');

  if (!chat.members.map((member) => member.toString()).includes(adminId))
    throw new AppError(400, 'User is not a member of this chat');

  if ([chat.owner.toString(), ...chat.admins.map((admin) => admin.toString())].includes(adminId))
    throw new AppError(400, 'User is already an admin of this chat');

  return await chatRepository.addGroupChatAdmin(adminId, chat.id);
};

export const removeGroupAdmin = async (currentUserId: string, adminId: string, chat: Chat) => {
  if (currentUserId === adminId) throw new AppError(403, 'You cannot remove yourself as admin');

  const admin = await userRepository.getVerifiedById(adminId);

  if (!admin) throw new AppError(404, 'User not found');

  if (!chat.admins.includes(toObjectId(adminId)))
    throw new AppError(400, 'User is not an admin of this chat');

  return await chatRepository.removeGroupChatAdmin(adminId, chat.id);
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
