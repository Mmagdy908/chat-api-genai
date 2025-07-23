import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { addGroupAdmin } from '../../../src/services/chatService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as chatRepository from '../../../src/repositories/chatRepository';
import { userFactory } from '../../utils/userFactory';
import { chatFactory } from '../../utils/chatFactory';
import { AppError } from '../../../src/util/appError';
import { toObjectId } from '../../../src/util/objectIdUtil';
import userModel from '../../../src/models/user';
import chatModel from '../../../src/models/chat';
import { Chat } from '../../../src/interfaces/models/chat';
import { Types } from 'mongoose';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/repositories/chatRepository');
jest.mock('../../../src/repositories/userChatRepository');
jest.mock('../../../src/util/objectIdUtil');

describe('chatService - addGroupAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(toObjectId).mockImplementation((id) => id as any);
  });
  test('should add admin to group chat', async () => {
    // Arrange
    const adminData = new userModel(userFactory.create({ isVerified: true }));
    const chat = new chatModel(
      chatFactory.create({
        members: [adminData.id],
        admins: [],
        owner: new Types.ObjectId().toString(),
      })
    );

    const updatedChat = { ...chat, admins: [adminData.id] } as Chat;
    jest.mocked(userRepository.getVerifiedById).mockResolvedValue(adminData);
    jest.mocked(chatRepository.addGroupChatAdmin).mockResolvedValue(updatedChat);

    // Act
    const result = await addGroupAdmin(adminData.id, chat);

    // Assert
    expect(userRepository.getVerifiedById).toHaveBeenCalledWith(adminData.id);
    expect(chatRepository.addGroupChatAdmin).toHaveBeenCalledWith(adminData.id, chat.id);
    expect(result).toEqual(updatedChat);
  });

  test('should throw error if admin not found', async () => {
    // Arrange
    const chat = new chatModel(
      chatFactory.create({
        members: [],
        admins: [],
        owner: new Types.ObjectId().toString(),
      })
    );
    jest.mocked(userRepository.getVerifiedById).mockResolvedValue(null);

    // Act & Assert
    await expect(addGroupAdmin('nonexistent-id', chat)).rejects.toThrow(
      new AppError(404, 'User not found')
    );
  });

  test('should throw error if user is not a member', async () => {
    // Arrange
    const adminData = new userModel(userFactory.create({ isVerified: true }));
    const chat = new chatModel(
      chatFactory.create({
        members: [],
        admins: [],
        owner: new Types.ObjectId().toString(),
      })
    );
    jest.mocked(userRepository.getVerifiedById).mockResolvedValue(adminData);

    // Act & Assert
    await expect(addGroupAdmin(adminData.id, chat)).rejects.toThrow(
      new AppError(400, 'User is not a member of this chat')
    );
  });

  test('should throw error if user is already an admin', async () => {
    // Arrange
    const adminData = new userModel(userFactory.create({ isVerified: true }));
    const chat = new chatModel(
      chatFactory.create({
        members: [adminData.id],
        admins: [adminData.id],
        owner: new Types.ObjectId().toString(),
      })
    );

    jest.mocked(userRepository.getVerifiedById).mockResolvedValue(adminData);

    // Act & Assert
    await expect(addGroupAdmin(adminData.id, chat)).rejects.toThrow(
      new AppError(400, 'User is already an admin of this chat')
    );
  });
});
