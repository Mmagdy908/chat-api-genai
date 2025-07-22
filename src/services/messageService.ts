import { Message } from '../interfaces/models/message';
import * as messageRepository from '../repositories/messageRepository';
import * as chatRepository from '../repositories/chatRepository';
import * as userChatRepository from '../repositories/userChatRepository';
import { toObjectId } from '../util/objectIdUtil';
import { AppError } from '../util/appError';
import {
  GetMessageResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '../schemas/messageSchemas';
import { User_Chat_Modification_Field } from '../enums/userChatEnums';
import { Message_Status } from '../enums/messageEnums';
import { Chat } from '../interfaces/models/chat';

const updateMessageStatus = async (chat: Chat, messages: Message[], status: Message_Status) => {
  const field = status === Message_Status.Seen ? 'seenBy' : 'deliveredTo';

  const previousStatuses =
    status === Message_Status.Delivered
      ? [Message_Status.Sent]
      : [Message_Status.Sent, Message_Status.Delivered];

  const promises = messages
    .filter(
      (message) =>
        previousStatuses.includes(message.status) &&
        message[field].length === chat.members.length - 1
    )
    .map((message) => messageRepository.updateById(message.id, { status }));
  return await Promise.all(promises);
};

export const getAllByChat = async (
  chatId: string,
  limit: string,
  before?: string
): Promise<GetMessageResponse[]> => {
  return await messageRepository.getAllByChat(chatId, limit, before);
};

export const getUnreadMessagesCount = async (userId: string, chatId: string): Promise<number> => {
  const lastSeenMessage = (
    await userChatRepository.getByUserAndChat(userId, chatId)
  )?.lastSeenMessage?.toString();

  return await messageRepository.getUnreadMessagesCount(userId, chatId, lastSeenMessage);
};

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

export const markMessagesAsDelivered = async (userId: string) => {
  // 1) get user chats
  const userChatIds = (
    await chatRepository.getAllChatsByMember(userId, { selectedFields: 'id' })
  ).map((chat) => chat.id);

  // 2) get last delivered message
  const lastDeliveredMessages = (await Promise.all(
    userChatIds.map(async (chatId) => {
      const userChat = await userChatRepository.getByUserAndChat(userId, chatId);
      return userChat?.lastDeliveredMessage?.toString();
    })
  )) as string | undefined[];

  // 3) mark messages as delivered
  const messagesPerChat = (
    await messageRepository.markMessagesAsDelivered(userId, userChatIds, lastDeliveredMessages)
  ).filter((chat) => chat.length);

  // 4) update last delivered message
  const lastDeliveredMessagePerChat = messagesPerChat.map((chat) => chat[chat.length - 1]);
  await userChatRepository.updateByUserAndChat(
    userId,
    lastDeliveredMessagePerChat,
    User_Chat_Modification_Field.Last_Delivered_Message
  );

  // 5) update message status as seen
  await Promise.all(
    messagesPerChat.map(async (chatMessages) => {
      const chat = await chatRepository.getById(chatMessages[0].chat.toString());
      await updateMessageStatus(chat as Chat, chatMessages, Message_Status.Delivered);
    })
  );

  // 6) return all marked messages grouped by sender id
  return Object.groupBy(messagesPerChat.flat(), (message: Message) => message.sender.toString());
};

export const markMessagesAsSeen = async (userId: string, chatId: string) => {
  // 1) get chat and check user is member
  const chat = await chatRepository.getById(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  if (!chat.members.includes(toObjectId(userId)))
    throw new AppError(403, 'User is not a member of this chat');

  // 2) get last seen message
  const lastSeenMessage = (
    await userChatRepository.getByUserAndChat(userId, chatId)
  )?.lastSeenMessage?.toString();

  // 3) mark messages in chat as seen
  const seenMessages = await messageRepository.markMessagesAsSeen(userId, chatId, lastSeenMessage);

  if (seenMessages.length) {
    // 4) update last seen message
    await userChatRepository.updateByUserAndChat(
      userId,
      [seenMessages[seenMessages.length - 1]],
      User_Chat_Modification_Field.Last_Seen_Message
    );

    // 5) update message status
    await updateMessageStatus(chat, seenMessages, Message_Status.Seen);
  }

  // 6) return all marked messages grouped by sender id
  return Object.groupBy(seenMessages, (message: Message) => message.sender.toString());
};
