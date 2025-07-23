import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { addGroupMember } from '../../../src/services/chatService';
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

describe('chatService - addGroupMember', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(toObjectId).mockImplementation((id) => id as any);
  });
  test('should add member to group chat', async () => {
    // Arrange
    const memberData = new userModel(userFactory.create({ isVerified: true }));
    const chat = new chatModel(
      chatFactory.create({
        members: [],
        admins: [],
        owner: 'owner-id',
      })
    );
    const updatedChat = { ...chat, members: [memberData.id] };
    jest.mocked(userRepository.getVerifiedById).mockResolvedValue(memberData);
    jest.mocked(chatRepository.addGroupChatMember).mockResolvedValue(updatedChat);
    jest.mocked(userChatRepository.create);

    // Act
    const result = await addGroupMember(memberData.id, chat);

    // Assert
    expect(userRepository.getVerifiedById).toHaveBeenCalledWith(memberData.id);
    expect(chatRepository.addGroupChatMember).toHaveBeenCalledWith(memberData.id, chat.id);
    expect(userChatRepository.create).toHaveBeenCalledWith(memberData.id, chat.id);
    expect(result).toEqual(updatedChat);
  });

  test('should throw error if member not found', async () => {
    // Arrange
    const chat = new chatModel(
      chatFactory.create({
        members: [],
        admins: [],
        owner: 'owner-id',
      })
    );
    jest.mocked(userRepository.getVerifiedById).mockResolvedValue(null);

    // Act & Assert
    await expect(addGroupMember('nonexistent-id', chat)).rejects.toThrow(
      new AppError(404, 'User not found')
    );
  });

  test('should throw error if user is already a member', async () => {
    // Arrange
    const memberData = new userModel(userFactory.create({ isVerified: true }));
    const chat = new chatModel(
      chatFactory.create({
        members: [memberData.id],
        admins: [],
        owner: 'owner-id',
      })
    );

    jest.mocked(userRepository.getVerifiedById).mockResolvedValue(memberData);

    // Act & Assert
    await expect(addGroupMember(memberData.id, chat)).rejects.toThrow(
      new AppError(400, 'User is already a member of this chat')
    );
  });
});
