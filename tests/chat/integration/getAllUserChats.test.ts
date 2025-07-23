import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import request from 'supertest';
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

describe('GET /api/v1/chats', () => {
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
  test('should fetch all user chats', async () => {
    // Arrange
    const chat2 = await chatModel.create({
      type: Chat_Type.Group,
      name: 'Another Group',
      owner: userId,
      members: [userId],
      admins: [userId],
    });
    await userChatModel.create({ user: userId, chat: chat2.id });

    // Act
    const response = await request(app)
      .get('/api/v1/chats')
      .query({ before: Date.now(), limit: 10, selectedFields: 'name members' })
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Chats are fetched successfully');
    expect(response.body.results).toBe(2);
    expect(response.body.data.chats).toHaveLength(2);
    expect(response.body.data.chats[0]).toMatchObject({
      id: expect.any(String),
      members: expect.any(Array),
    });
    expect(authMiddleware.protect).toHaveBeenCalled();
  });

  test('should return empty array if no chats found', async () => {
    // Arrange
    await chatModel.deleteMany({});

    // Act
    const response = await request(app)
      .get('/api/v1/chats')
      .query({ before: Date.now(), limit: 10 })
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Chats are fetched successfully');
    expect(response.body.results).toBe(0);
    expect(response.body.data.chats).toEqual([]);
    expect(authMiddleware.protect).toHaveBeenCalled();
  });
});
