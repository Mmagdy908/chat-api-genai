import { Message } from '../interfaces/models/message';
import * as messageRepository from '../repositories/messageRepository';
import * as chatRepository from '../repositories/chatRepository';
import * as userChatRepository from '../repositories/userChatRepository';
import * as genaiService from '../services/genaiService';
import { toObjectId } from '../util/objectIdUtil';
import { AppError } from '../util/appError';
import {
  GetMessageResponse,
  SendGenaiMessageRequest,
  SendMessageRequest,
  SendMessageResponse,
} from '../schemas/messageSchemas';
import { User_Chat_Modification_Field } from '../enums/userChatEnums';
import { Message_Status, Message_Type } from '../enums/messageEnums';
import { Chat } from '../interfaces/models/chat';
import { genaiProducer, messageProducer } from '../kafka/producer';

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
  limit?: string,
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

export const produceMessage = async (messageData: SendMessageRequest) => {
  await messageProducer(messageData);
};

export const send = async (
  messageData: SendMessageRequest | SendGenaiMessageRequest
): Promise<SendMessageResponse> => {
  // get chat
  const chat = await chatRepository.getById(messageData.chat.toString(), {
    path: 'lastMessage',
    select: 'createdAt',
  });

  // check if chat exists
  if (!chat) throw new AppError(404, 'Chat not found');

  // check if sender is a member in chat
  if ('sender' in messageData && !chat.members.includes(toObjectId(messageData.sender)))
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

  // handle genai response
  if ('genai' in messageData && messageData.genai) {
    await genaiService.generateGenaiResponse({
      text: messageData.prompt.text,
      mediaUrl: messageData.prompt.mediaUrl,
      chatId: messageData.chat,
      messageId: message.id,
      genaiStreaming: messageData.genaiStreaming || false,
    });
  }

  // check if mentioning genai
  if (messageData.content.text?.match(/@genai\b/)) {
    await messageProducer({
      chat: chat.id,
      content: {
        contentType: Message_Type.Text,
        text: '',
      },
      genai: true,
      prompt: {
        text: messageData.content.text?.replace('@genai', ''),
        mediaUrl: messageData.content.mediaUrl,
      },
      genaiStreaming: messageData.genaiStreaming,
    });
    // await genaiProducer({
    //   messageType: message.content.contentType,
    //   chat: message.chat.toString(),
    //   content: message.content,
    // });
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

export const appendMessageText = async (id: string, append: string) => {
  return await messageRepository.appendMessage(id, append);
};
