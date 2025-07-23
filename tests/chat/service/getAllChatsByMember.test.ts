import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getAllChatsByMember } from '../../../src/services/chatService';
import * as chatRepository from '../../../src/repositories/chatRepository';
import { chatFactory } from '../../utils/chatFactory';
import { toObjectId } from '../../../src/util/objectIdUtil';
import chatModel from '../../../src/models/chat';
import { Types } from 'mongoose';
import { GetChatResponse } from '../../../src/schemas/chatSchemas';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/repositories/chatRepository');
jest.mock('../../../src/repositories/userChatRepository');
jest.mock('../../../src/util/objectIdUtil');

describe('chatService - getAllChatsByMember', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(toObjectId).mockImplementation((id) => id as any);
  });
  test('should fetch all chats for member', async () => {
    // Arrange
    const userId = new Types.ObjectId().toString();

    const chats = [
      new chatModel(chatFactory.create({ members: [userId], owner: userId })),
      new chatModel(chatFactory.create({ members: [userId], owner: userId })),
    ] as GetChatResponse[];

    jest.mocked(chatRepository.getAllChatsByMember).mockResolvedValue(chats);

    // Act
    const result = await getAllChatsByMember(userId, {
      before: 123456789,
      limit: 10,
      selectedFields: 'name members',
    });

    // Assert
    expect(chatRepository.getAllChatsByMember).toHaveBeenCalledWith(userId, {
      before: 123456789,
      limit: 10,
      selectedFields: 'name members',
      populateOptions: [
        { path: 'members', select: 'firstName lastName photo' },
        { path: 'lastMessage', populate: 'sender' },
      ],
    });
    expect(result).toEqual(chats);
  });

  test('should return empty array if no chats found', async () => {
    // Arrange
    const userId = 'user-id';
    jest.mocked(chatRepository.getAllChatsByMember).mockResolvedValue([]);

    // Act
    const result = await getAllChatsByMember(userId);

    // Assert
    expect(chatRepository.getAllChatsByMember).toHaveBeenCalledWith(userId, {
      populateOptions: [
        { path: 'members', select: 'firstName lastName photo' },
        { path: 'lastMessage', populate: 'sender' },
      ],
    });
    expect(result).toEqual([]);
  });
});
