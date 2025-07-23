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

describe('getUnreadMessagesCount controller', () => {
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

  test('should fetch unread messages count and return success response', async () => {
    // Arrange
    const count = 5;
    jest.mocked(messageService.getUnreadMessagesCount).mockResolvedValue(count);

    // Act
    await getUnreadMessagesCount(req as Request, res as Response, next);

    // Assert
    expect(messageService.getUnreadMessagesCount).toHaveBeenCalledWith(
      req.user?.id as string,
      'chat-id'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { count },
      message: 'Unread messages count is fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 0 for no unread messages', async () => {
    // Arrange
    jest.mocked(messageService.getUnreadMessagesCount).mockResolvedValue(0);

    // Act
    await getUnreadMessagesCount(req as Request, res as Response, next);

    // Assert
    expect(messageService.getUnreadMessagesCount).toHaveBeenCalledWith(
      req.user?.id as string,
      'chat-id'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { count: 0 },
      message: 'Unread messages count is fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
