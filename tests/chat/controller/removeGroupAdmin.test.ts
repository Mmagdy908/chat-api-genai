import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { removeGroupAdmin } from '../../../src/controllers/http/chatController';
import * as chatService from '../../../src/services/chatService';
import * as chatSchemas from '../../../src/schemas/chatSchemas';
import { Request, Response, NextFunction } from 'express';
import { userFactory } from '../../utils/userFactory';
import userModel from '../../../src/models/user';
import chatModel from '../../../src/models/chat';
import { chatFactory } from '../../utils/chatFactory';
import { Types } from 'mongoose';
import { User } from '../../../src/interfaces/models/user';

jest.mock('../../../src/services/chatService');
jest.mock('../../../src/schemas/chatSchemas');

describe('removeGroupAdmin controller', () => {
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

  test('should remove group admin and return success response', async () => {
    // Arrange
    const adminId = new Types.ObjectId().toString();

    const chat = new chatModel(
      chatFactory.create({
        members: [],
        admins: [adminId],
        owner: req.user?.id,
      })
    );

    const updatedChat = { ...chat, admins: [] };
    const mappedChat = { ...updatedChat, mapped: true } as chatSchemas.GetChatResponse;
    req.params = { adminId };
    req.chat = chat;
    jest.mocked(chatService.removeGroupAdmin).mockResolvedValue(updatedChat);
    jest.mocked(chatSchemas.mapGetResponse).mockReturnValue(mappedChat);

    // Act
    await removeGroupAdmin(req as Request, res as Response, next);

    // Assert
    expect(chatService.removeGroupAdmin).toHaveBeenCalledWith(
      req.user?.id as string,
      adminId,
      chat
    );
    expect(chatSchemas.mapGetResponse).toHaveBeenCalledWith(
      updatedChat as chatSchemas.GetChatResponse
    );
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { chat: mappedChat },
      message: 'Group chat admin is removed successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
