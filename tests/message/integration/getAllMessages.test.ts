import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import chatModel from '../../../src/models/chat';
import userChatModel from '../../../src/models/userChat';
import messageModel from '../../../src/models/message';
import { userFactory } from '../../utils/userFactory';
import { messageFactory } from '../../utils/messageFactory';
import * as authMiddleware from '../../../src/middlewares/authMiddleware';
import * as chatMiddleware from '../../../src/middlewares/chatMiddleware';
import { Chat_Type } from '../../../src/enums/chatEnums';
import { User } from '../../../src/interfaces/models/user';
import chat from '../../../src/models/chat';
import { mapPopulatedUser } from '../../utils/mappers';

jest.mock('../../../src/middlewares/authMiddleware');
jest.mock('../../../src/middlewares/chatMiddleware');

describe('Message API', () => {
  describe('GET /api/v1/chats/:chatId/messages', () => {
    setupIntegrationTests();

    let userId: string;
    let chatId: string;
    let user: User;

    beforeEach(async () => {
      jest.clearAllMocks();
      // Mock authMiddleware.protect

      // Create a user and chat for tests
      const userData = userFactory.create({ isVerified: true });
      user = await userModel.create(userData);

      userId = user.id;

      const chat = await chatModel.create({
        type: Chat_Type.Group,
        name: 'Test Group',
        owner: userId,
        members: [userId],
        admins: [userId],
      });

      chatId = chat.id;

      await userChatModel.create({ user: userId, chat: chatId });

      jest.mocked(authMiddleware.protect).mockImplementation((req, _res, next) => {
        req.user = { id: userId } as User;
        next();
      });

      // Mock chatMiddleware.isChatMember
      jest.mocked(chatMiddleware.isChatMember).mockImplementation((req, _res, next) => {
        req.chat = chat;

        next();
      });
    });

    test('should fetch all messages for a chat', async () => {
      // Arrange
      const messages = [
        new messageModel(messageFactory.create({ chat: chatId, sender: userId })),

        new messageModel(messageFactory.create({ chat: chatId, sender: userId })),
      ];
      await messageModel.create(messages);

      // Act
      const response = await request(app)
        .get(`/api/v1/chats/${chatId}/messages`)
        .query({ limit: 10, before: messages[1]?.id })
        .expect(200);

      // Assert

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Messages are fetched successfully');
      expect(response.body.results).toBe(1);
      expect(response.body.data.messages).toHaveLength(1);
      expect(response.body.data.messages[0]).toMatchObject({
        chat: chatId,
        sender: mapPopulatedUser(user),
      });
      expect(authMiddleware.protect).toHaveBeenCalled();
      expect(chatMiddleware.isChatMember).toHaveBeenCalled();
    });

    test('should return empty array if no messages found', async () => {
      // Act
      const response = await request(app).get(`/api/v1/chats/${chatId}/messages`).expect(200);

      // Assert
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Messages are fetched successfully');
      expect(response.body.results).toBe(0);
      expect(response.body.data.messages).toEqual([]);
      expect(authMiddleware.protect).toHaveBeenCalled();
      expect(chatMiddleware.isChatMember).toHaveBeenCalled();
    });
  });
});
