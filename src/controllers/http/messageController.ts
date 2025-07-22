import { Request, Response, NextFunction } from 'express';
import * as messageService from '../../services/messageService';
import catchAsync from '../../util/catchAsync';
import { GetMessageResponse, mapGetResponse } from '../../schemas/messageSchemas';

export const getAllMessages = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const messages = await messageService.getAllByChat(
      req.params.chatId,
      req.query.limit as string,
      req.query.before as string
    );

    res.status(200).json({
      status: 'success',
      data: { messages: messages.map((message: GetMessageResponse) => mapGetResponse(message)) },
      results: messages.length,
      message: 'Messages are fetched successfully',
    });
  }
);

export const getUnreadMessagesCount = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const count = await messageService.getUnreadMessagesCount(req.user.id, req.params.chatId);

    res.status(200).json({
      status: 'success',
      data: { count },
      message: 'Unread messages count is fetched successfully',
    });
  }
);
