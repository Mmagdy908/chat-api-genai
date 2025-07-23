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

describe('messageService - getAllByChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch all messages for a chat', async () => {
    // Arrange
    const chatId = 'chat-id';
    const messages = [
      new messageModel(messageFactory.create()),
      new messageModel(messageFactory.create()),
      ,
    ] as GetMessageResponse[];
    jest.mocked(messageRepository.getAllByChat).mockResolvedValue(messages);

    // Act
    const result = await getAllByChat(chatId, '10', 'msg3');

    // Assert
    expect(messageRepository.getAllByChat).toHaveBeenCalledWith(chatId, '10', 'msg3');
    expect(result).toEqual(messages);
  });

  test('should return empty array if no messages found', async () => {
    // Arrange
    const chatId = 'chat-id';
    jest.mocked(messageRepository.getAllByChat).mockResolvedValue([]);

    // Act
    const result = await getAllByChat(chatId, '10', undefined);

    // Assert
    expect(messageRepository.getAllByChat).toHaveBeenCalledWith(chatId, '10', undefined);
    expect(result).toEqual([]);
  });
});
