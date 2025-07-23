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

jest.mock('../../../src/middlewares/authMiddleware');
jest.mock('../../../src/middlewares/chatMiddleware');
describe('GET /api/v1/chats/:chatId/unread-messages-count', () => {
  setupIntegrationTests();

  let userId: string;
  let chatId: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Mock authMiddleware.protect

    // Create a user and chat for tests
    const userData = userFactory.create({ isVerified: true });
    const user = await userModel.create(userData);

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

  test('should fetch unread messages count', async () => {
    // Arrange
    const otherUser = await userModel.create(
      userFactory.create({ email: 'other@example.com', username: 'other', isVerified: true })
    );
    await chatModel.findByIdAndUpdate(chatId, { $push: { members: otherUser.id } });
    await userChatModel.create({ user: otherUser.id, chat: chatId });
    const messages = [
      messageFactory.create({
        chat: chatId,
        sender: otherUser.id,
      }),
      messageFactory.create({
        chat: chatId,
        sender: otherUser.id,
      }),
    ];
    await messageModel.insertMany(messages);
    await userChatModel.findOneAndUpdate({ user: userId, chat: chatId }, { lastSeenMessage: null });

    // Act
    const response = await request(app)
      .get(`/api/v1/chats/${chatId}/messages/unread-messages-count`)
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Unread messages count is fetched successfully');
    expect(response.body.data.count).toBe(2);
    expect(authMiddleware.protect).toHaveBeenCalled();
    expect(chatMiddleware.isChatMember).toHaveBeenCalled();
  });

  test('should return 0 if no unread messages', async () => {
    // Arrange
    const message = await messageModel.create(
      messageFactory.create({ chat: chatId, sender: userId })
    );

    await userChatModel.findOneAndUpdate(
      { user: userId, chat: chatId },
      { lastSeenMessage: message.id }
    );

    // Act
    const response = await request(app)
      .get(`/api/v1/chats/${chatId}/messages/unread-messages-count`)
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Unread messages count is fetched successfully');
    expect(response.body.data.count).toBe(0);
    expect(authMiddleware.protect).toHaveBeenCalled();
    expect(chatMiddleware.isChatMember).toHaveBeenCalled();
  });
});
