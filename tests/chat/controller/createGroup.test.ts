import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { createGroup } from '../../../src/controllers/http/chatController';
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

describe('createGroup controller', () => {
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

  test('should create group chat and return success response', async () => {
    // Arrange
    const groupData = { name: 'Test Group', members: [user.id] };
    const mappedGroup = { ...groupData, owner: user.id, mapped: true };
    const chat = new chatModel(chatFactory.create({ ...groupData, owner: user.id }));
    const mappedChat = { ...chat, mapped: true } as chatSchemas.GetChatResponse;
    req.body = groupData;
    jest.mocked(chatSchemas.mapCreateGroupRequest).mockReturnValue(mappedGroup);
    jest.mocked(chatService.createGroup).mockResolvedValue(chat);
    jest.mocked(chatSchemas.mapGetResponse).mockReturnValue(mappedChat);

    // Act
    await createGroup(req as Request, res as Response, next);

    // Assert
    expect(chatSchemas.mapCreateGroupRequest).toHaveBeenCalledWith({
      ...groupData,
      owner: user.id,
    });
    expect(chatService.createGroup).toHaveBeenCalledWith(mappedGroup);
    expect(chatSchemas.mapGetResponse).toHaveBeenCalledWith(chat as chatSchemas.GetChatResponse);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { chat: mappedChat },
      message: 'Group chat is created successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
