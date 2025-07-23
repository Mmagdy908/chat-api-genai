import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { removeGroupAdmin } from '../../../src/services/chatService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as chatRepository from '../../../src/repositories/chatRepository';
import { userFactory } from '../../utils/userFactory';
import { chatFactory } from '../../utils/chatFactory';
import { AppError } from '../../../src/util/appError';
import userModel from '../../../src/models/user';
import chatModel from '../../../src/models/chat';
import { toObjectId } from '../../../src/util/objectIdUtil';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/repositories/chatRepository');
jest.mock('../../../src/repositories/userChatRepository');
jest.mock('../../../src/util/objectIdUtil');

describe('chatService - removeGroupAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(toObjectId).mockImplementation((id) => id as any);
  });
  test('should remove admin from group chat', async () => {
    // Arrange
    const adminData = new userModel(userFactory.create({ isVerified: true }));
    const chat = new chatModel(
      chatFactory.create({
        members: [adminData.id],
        admins: [adminData.id],
        owner: 'owner-id',
      })
    );
    const updatedChat = { ...chat, admins: [] };
    jest.mocked(userRepository.getVerifiedById).mockResolvedValue(adminData);
    jest.mocked(chatRepository.removeGroupChatAdmin).mockResolvedValue(updatedChat);

    // Act
    const result = await removeGroupAdmin('owner-id', adminData.id, chat);

    // Assert
    expect(userRepository.getVerifiedById).toHaveBeenCalledWith(adminData.id);
    expect(chatRepository.removeGroupChatAdmin).toHaveBeenCalledWith(adminData.id, chat.id);
    expect(result).toEqual(updatedChat);
  });

  test('should throw error if removing self', async () => {
    // Arrange
    const chat = new chatModel(chatFactory.create({}));

    // Act & Assert
    await expect(
      removeGroupAdmin(chat.members[0].toString(), chat.members[0].toString(), chat)
    ).rejects.toThrow(new AppError(403, 'You cannot remove yourself as admin'));
  });

  test('should throw error if admin not found', async () => {
    // Arrange
    const chat = new chatModel(chatFactory.create({ members: [], admins: [], owner: 'owner-id' }));

    jest.mocked(userRepository.getVerifiedById).mockResolvedValue(null);

    // Act & Assert
    await expect(removeGroupAdmin('owner-id', 'nonexistent-id', chat)).rejects.toThrow(
      new AppError(404, 'User not found')
    );
  });

  test('should throw error if user is not an admin', async () => {
    // Arrange
    const adminData = new userModel(userFactory.create({ isVerified: true }));
    const chat = new chatModel(
      chatFactory.create({ members: [adminData.id], admins: [], owner: 'owner-id' })
    );

    jest.mocked(userRepository.getVerifiedById).mockResolvedValue(adminData);

    // Act & Assert
    await expect(removeGroupAdmin('owner-id', adminData.id, chat)).rejects.toThrow(
      new AppError(400, 'User is not an admin of this chat')
    );
  });
});
