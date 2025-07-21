import { PopulateOptions, Schema } from 'mongoose';
import { Chat } from '../interfaces/models/chat';
import chatModel from '../models/chat';
import { Chat_Type } from '../enums/chatEnums';
import { CreateGroupChatRequest, GetChatResponse } from '../schemas/chatSchemas';

export const createPrivateChat = async (membersId: string[]): Promise<Chat> => {
  return await chatModel.create({
    type: Chat_Type.Private,
    members: membersId,
  });
};

export const createGroupChat = async (groupChatData: CreateGroupChatRequest): Promise<Chat> => {
  const chat = await chatModel.create({
    ...groupChatData,
    type: Chat_Type.Group,
  });
  return await chat.populate({ path: 'members', select: 'firstName lastName photo' });
};

export const getById = async (
  id: string,
  ...populateOptions: PopulateOptions[]
): Promise<Chat | null> => {
  const query = chatModel.findById(id);

  populateOptions?.forEach((option) => query.populate(option));

  return await query;
};

// export const getByMembers = async (
//   membersId: string[],
//   ...populateOptions: PopulateOptions[]
// ): Promise<Chat | null> => {
//   const query = chatModel.findOne({ members: { $all: membersId } });

//   populateOptions?.forEach((option) => query.populate(option));

//   return await query;
// };

export const getAllChatsByMember = async (
  memberId: string,
  options?: {
    before?: number;
    limit?: number;
    selectedFields?: string;
    populateOptions?: PopulateOptions[];
  }
): Promise<GetChatResponse[]> => {
  const query = chatModel.find({ members: { $elemMatch: { $eq: memberId } } });

  if (options?.before) query.find({ updatedAt: { $lt: new Date(options.before) } });

  query.select(options!.selectedFields!).limit(options!.limit!).sort('-updatedAt');

  options?.populateOptions?.forEach((option) => query.populate(option));

  return (await query) as GetChatResponse[];
};

export const updateById = async (id: string, newChatData: Partial<Chat>): Promise<Chat | null> => {
  return await chatModel.findByIdAndUpdate(id, newChatData, { new: true });
};
