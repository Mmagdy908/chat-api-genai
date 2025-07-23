import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import chatModel from '../../../src/models/chat';
import userChatModel from '../../../src/models/userChat';
import { userFactory } from '../../utils/userFactory';
import * as authMiddleware from '../../../src/middlewares/authMiddleware';
import * as chatMiddleware from '../../../src/middlewares/chatMiddleware';
import { Chat_Type } from '../../../src/enums/chatEnums';
import { User } from '../../../src/interfaces/models/user';
import { Chat } from '../../../src/interfaces/models/chat';

jest.mock('../../../src/middlewares/authMiddleware');
jest.mock('../../../src/middlewares/chatMiddleware');

const mapPopulatedUser = (user: User) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  photo: user.photo,
});

describe('POST /api/v1/chats/group', () => {
  setupIntegrationTests();
  let user: User;
  let chat: Chat;
  let userId: string;
  let chatId: string;

  beforeEach(async () => {
    // Create a user for tests
    const userData = userFactory.create({ isVerified: true });
    user = await userModel.create(userData);
    userId = user.id;

    // Create a chat for tests
    chat = await chatModel.create({
      type: Chat_Type.Group,
      name: 'Test Group',
      owner: userId,
      members: [userId],
      admins: [],
    });

    chatId = chat.id;

    await userChatModel.create({ user: userId, chat: chatId });

    jest.clearAllMocks();
    // Mock authMiddleware.protect
    jest.mocked(authMiddleware.protect).mockImplementation((req, _res, next) => {
      req.user = { id: userId } as User;
      next();
    });
    // Mock chatMiddleware.isGroupChatAdmin
    jest.mocked(chatMiddleware.isGroupChatAdmin).mockImplementation((req, _res, next) => {
      req.chat = chat;
      next();
    });
  });
  test('should create group chat', async () => {
    // Arrange
    const memberData = userFactory.create({
      email: 'member@example.com',
      username: 'member',
      isVerified: true,
    });
    const member = await userModel.create(memberData);
    const groupData = { metaData: { name: 'New Group' }, members: [member.id] };

    // Act
    const response = await request(app).post('/api/v1/chats/group').send(groupData).expect(201);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Group chat is created successfully');
    expect(response.body.data.chat).toMatchObject({
      metaData: { name: 'New Group' },
      members: expect.arrayContaining([mapPopulatedUser(user), mapPopulatedUser(member)]),
      owner: userId,
      type: Chat_Type.Group,
    });
    expect(authMiddleware.protect).toHaveBeenCalled();
  });

  test('should return 404 if member not found', async () => {
    // Arrange
    const groupData = { name: 'New Group', members: [new Types.ObjectId().toString()] };

    // Act
    const response = await request(app).post('/api/v1/chats/group').send(groupData).expect(404);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toBe('Some members are not found');
    expect(authMiddleware.protect).toHaveBeenCalled();
  });
});
