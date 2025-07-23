import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getAllByChat, getUnreadMessagesCount } from '../../../src/services/messageService';
import * as messageRepository from '../../../src/repositories/messageRepository';
import * as userChatRepository from '../../../src/repositories/userChatRepository';
import { userFactory } from '../../utils/userFactory';
import { messageFactory } from '../../utils/messageFactory';
import userModel from '../../../src/models/user';
import messageModel from '../../../src/models/message';
import { GetMessageResponse } from '../../../src/schemas/messageSchemas';

jest.mock('../../../src/repositories/messageRepository');
jest.mock('../../../src/repositories/userChatRepository');

describe('messageService - getUnreadMessagesCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return count of unread messages', async () => {
    // Arrange
    const userId = new userModel(userFactory.create()).id;
    const chatId = 'chat-id';
    const lastSeenMessage = 'msg1';
    const count = 5;
    jest.mocked(userChatRepository.getByUserAndChat).mockResolvedValue({ lastSeenMessage } as any);
    jest.mocked(messageRepository.getUnreadMessagesCount).mockResolvedValue(count);

    // Act
    const result = await getUnreadMessagesCount(userId, chatId);

    // Assert
    expect(userChatRepository.getByUserAndChat).toHaveBeenCalledWith(userId, chatId);
    expect(messageRepository.getUnreadMessagesCount).toHaveBeenCalledWith(
      userId,
      chatId,
      lastSeenMessage
    );
    expect(result).toEqual(count);
  });

  test('should return 0 if no last seen message', async () => {
    // Arrange
    const userId = new userModel(userFactory.create()).id;
    const chatId = 'chat-id';
    const count = 0;
    jest.mocked(userChatRepository.getByUserAndChat).mockResolvedValue(null);
    jest.mocked(messageRepository.getUnreadMessagesCount).mockResolvedValue(count);

    // Act
    const result = await getUnreadMessagesCount(userId, chatId);

    // Assert
    expect(userChatRepository.getByUserAndChat).toHaveBeenCalledWith(userId, chatId);
    expect(messageRepository.getUnreadMessagesCount).toHaveBeenCalledWith(
      userId,
      chatId,
      undefined
    );
    expect(result).toEqual(count);
  });
});
