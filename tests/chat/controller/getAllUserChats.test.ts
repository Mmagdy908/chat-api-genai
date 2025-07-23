import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { getAllUserChats } from '../../../src/controllers/http/chatController';
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

describe('getAllUserChats controller', () => {
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

  test('should fetch all user chats and return success response', async () => {
    // Arrange

    const chats = [
      new chatModel(
        chatFactory.create({
          members: [req.user?.id as string],
          admins: [],
          owner: req.user?.id,
        })
      ),
      new chatModel(
        chatFactory.create({
          members: [req.user?.id as string],
          admins: [],
          owner: req.user?.id,
        })
      ),
    ] as chatSchemas.GetChatResponse[];
    const mappedChats = chats.map((chat) => ({ ...chat, mapped: true }));
    req.query = { before: '123456789', limit: '10', selectedFields: 'name members' };
    jest.mocked(chatService.getAllChatsByMember).mockResolvedValue(chats);
    jest
      .mocked(chatSchemas.mapGetResponse)
      .mockImplementation((chat) => ({ ...chat, mapped: true }));

    // Act
    await getAllUserChats(req as Request, res as Response, next);

    // Assert
    expect(chatService.getAllChatsByMember).toHaveBeenCalledWith(req.user?.id as string, {
      before: 123456789,
      limit: 10,
      selectedFields: 'name members',
    });
    expect(chatSchemas.mapGetResponse).toHaveBeenCalledTimes(chats.length);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { chats: mappedChats },
      results: chats.length,
      message: 'Chats are fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
