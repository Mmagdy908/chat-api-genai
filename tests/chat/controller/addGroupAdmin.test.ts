import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { addGroupAdmin } from '../../../src/controllers/http/chatController';
import * as chatService from '../../../src/services/chatService';
import * as chatSchemas from '../../../src/schemas/chatSchemas';
import { Request, Response, NextFunction } from 'express';
import { userFactory } from '../../utils/userFactory';
import userModel from '../../../src/models/user';
import chatModel from '../../../src/models/chat';
import { chatFactory } from '../../utils/chatFactory';
import { User } from '../../../src/interfaces/models/user';

jest.mock('../../../src/services/chatService');
jest.mock('../../../src/schemas/chatSchemas');

describe('addGroupAdmin controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let user: User;
  beforeEach(() => {
    jest.clearAllMocks();
    user = new userModel(userFactory.create({ isVerified: true }));
    req = getMockReq({
      user: { id: user.id },
    });
    ({ res, next } = getMockRes());
    next = jest.fn();
  });

  test('should add group admin and return success response', async () => {
    // Arrange
    const chat = new chatModel(
      chatFactory.create({
        members: [],
        admins: [],
        owner: req.user?.id,
      })
    );

    const adminId = new userModel(userFactory.create()).id;
    const updatedChat = { ...chat, admins: [adminId] };
    const mappedChat = { ...updatedChat, mapped: true } as chatSchemas.GetChatResponse;
    req.body = { adminId };
    req.chat = chat;
    jest.mocked(chatService.addGroupAdmin).mockResolvedValue(updatedChat);
    jest.mocked(chatSchemas.mapGetResponse).mockReturnValue(mappedChat);

    // Act
    await addGroupAdmin(req as Request, res as Response, next);

    // Assert
    expect(chatService.addGroupAdmin).toHaveBeenCalledWith(adminId, chat);
    expect(chatSchemas.mapGetResponse).toHaveBeenCalledWith(
      updatedChat as chatSchemas.GetChatResponse
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { chat: mappedChat },
      message: 'Group chat admin is added successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
