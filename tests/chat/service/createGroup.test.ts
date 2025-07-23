import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { createGroup } from '../../../src/services/chatService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as chatRepository from '../../../src/repositories/chatRepository';
import * as userChatRepository from '../../../src/repositories/userChatRepository';
import { userFactory } from '../../utils/userFactory';
import { chatFactory } from '../../utils/chatFactory';
import { AppError } from '../../../src/util/appError';
import { toObjectId } from '../../../src/util/objectIdUtil';
import userModel from '../../../src/models/user';
import chatModel from '../../../src/models/chat';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/repositories/chatRepository');
jest.mock('../../../src/repositories/userChatRepository');
jest.mock('../../../src/util/objectIdUtil');

describe('chatService - createGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(toObjectId).mockImplementation((id) => id as any);
  });
  test('should create group chat with valid data', async () => {
    // Arrange
    const userData = new userModel(
      userFactory.create({ email: 'user@example.com', username: 'user', isVerified: true })
    );
    const memberData = new userModel(userFactory.create({ isVerified: true }));
    const groupData = { name: 'Test Group', owner: userData.id, members: [memberData.id] };
    const chat = new chatModel(chatFactory.create());
    jest.mocked(userRepository.getById).mockResolvedValue(memberData);
    jest.mocked(chatRepository.createGroupChat).mockResolvedValue(chat);
    jest.mocked(userChatRepository.create);

    // Act
    const result = await createGroup(groupData);

    // Assert
    expect(userRepository.getById).toHaveBeenCalledWith(memberData.id);
    expect(chatRepository.createGroupChat).toHaveBeenCalledWith({
      ...groupData,
      members: [memberData.id, userData.id],
    });
    expect(userChatRepository.create).toHaveBeenCalledTimes(2);
    expect(userChatRepository.create).toHaveBeenCalledWith(memberData.id, chat.id);
    expect(userChatRepository.create).toHaveBeenCalledWith(userData.id, chat.id);
    expect(result).toEqual(chat);
  });

  test('should throw error if member not found', async () => {
    // Arrange
    const groupData = { name: 'Test Group', owner: 'owner-id', members: ['nonexistent-id'] };
    jest.mocked(userRepository.getById).mockResolvedValue(null);

    // Act & Assert
    await expect(createGroup(groupData)).rejects.toThrow(
      new AppError(404, 'Some members are not found')
    );
    expect(userRepository.getById).toHaveBeenCalledWith('nonexistent-id');
  });
});
