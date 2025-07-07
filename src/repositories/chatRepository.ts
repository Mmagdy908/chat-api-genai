import { PopulateOptions } from 'mongoose';
import { Chat } from '../interfaces/models/chat';
import chatModel from '../models/chat';
import { Chat_Type } from '../enums/chatEnums';

export const createPrivateChat = async (membersId: string[]): Promise<Chat> => {
  return await chatModel.create({
    type: Chat_Type.Private,
    members: membersId,
  });
};

export const getById = async (
  id: string,
  ...populateOptions: PopulateOptions[]
): Promise<Chat | null> => {
  const query = chatModel.findById(id);

  populateOptions?.forEach((option) => query.populate(option));

  return await query;
};

export const getByMembers = async (
  membersId: string[],
  ...populateOptions: PopulateOptions[]
): Promise<Chat | null> => {
  const query = chatModel.findOne({ members: { $all: membersId } });

  populateOptions?.forEach((option) => query.populate(option));

  return await query;
};

export const getAllChatsByMember = async (
  memberId: string,
  ...selectedFields: string[]
): Promise<Chat[]> => {
  return await chatModel
    .find({ members: { $elemMatch: { $eq: memberId } } })
    .select(selectedFields);
};

export const updateById = async (id: string, newChatData: Partial<Chat>): Promise<Chat | null> => {
  return await chatModel.findByIdAndUpdate(id, newChatData, { new: true });
};
