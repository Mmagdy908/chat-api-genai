import { Message } from '../interfaces/models/message';
import { UserChat } from '../interfaces/models/userChat';
import userChatModel from '../models/userChat';
import { User_Chat_Modification_Field } from '../enums/userChatEnums';

export const create = async (userId: string, chatId: string): Promise<UserChat> => {
  return await userChatModel.create({ user: userId, chat: chatId });
};

export const getByUserAndChat = async (
  userId: string,
  chatId: string
): Promise<UserChat | null> => {
  return await userChatModel.findOne({ user: userId, chat: chatId });
};

export const updateByUserAndChat = async (
  userId: string,
  messages: Message[],
  field: User_Chat_Modification_Field
): Promise<void> => {
  await Promise.all(
    messages.map((message) =>
      userChatModel.findOneAndUpdate({ user: userId, chat: message.chat }, { [field]: message.id })
    )
  );
};
