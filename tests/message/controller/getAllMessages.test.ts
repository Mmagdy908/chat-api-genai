import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import {
  getAllMessages,
  getUnreadMessagesCount,
} from '../../../src/controllers/http/messageController';
import * as messageService from '../../../src/services/messageService';
import * as messageSchemas from '../../../src/schemas/messageSchemas';
import { Request, Response, NextFunction } from 'express';
import { userFactory } from '../../utils/userFactory';
import { messageFactory } from '../../utils/messageFactory';
import { Message_Status } from '../../../src/enums/messageEnums';
import userModel from '../../../src/models/user';
import messageModel from '../../../src/models/message';

jest.mock('../../../src/services/messageService');
jest.mock('../../../src/schemas/messageSchemas');

describe('getAllMessages controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    const user = new userModel(userFactory.create({ isVerified: true }));
    req = getMockReq({
      user: { id: user.id },
      params: { chatId: 'chat-id' },
    });
    ({ res, next } = getMockRes());
    next = jest.fn();
  });

  test('should fetch all messages and return success response', async () => {
    // Arrange
    const messages = [
      new messageModel(messageFactory.create()),

      new messageModel(messageFactory.create()),
    ] as messageSchemas.GetMessageResponse[];

    const mappedMessages = messages.map((msg) => ({ ...msg, mapped: true }));
    jest.mocked(messageService.getAllByChat).mockResolvedValue(messages);
    jest
      .mocked(messageSchemas.mapGetResponse)
      .mockImplementation((msg) => ({ ...msg, mapped: true }));

    // Act
    await getAllMessages(req as Request, res as Response, next);
    console.log(messages);
    // Assert
    expect(messageService.getAllByChat).toHaveBeenCalledWith('chat-id', undefined, undefined);
    expect(messageSchemas.mapGetResponse).toHaveBeenCalledTimes(messages.length);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { messages: mappedMessages },
      results: messages.length,
      message: 'Messages are fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return empty array for no messages', async () => {
    // Arrange
    req.query = { limit: '10' };
    jest.mocked(messageService.getAllByChat).mockResolvedValue([]);

    // Act
    await getAllMessages(req as Request, res as Response, next);

    // Assert
    expect(messageService.getAllByChat).toHaveBeenCalledWith('chat-id', '10', undefined);
    expect(messageSchemas.mapGetResponse).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { messages: [] },
      results: 0,
      message: 'Messages are fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
