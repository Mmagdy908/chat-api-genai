import { Request, Response, NextFunction } from 'express';
import * as chatService from '../../services/chatService';
import catchAsync from '../../util/catchAsync';
import { GetChatResponse, mapGetResponse } from '../../schemas/chatSchemas';

export const getAllUserChats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const chats = await chatService.getAllChatsByMember(req.user.id, {
      before: parseInt(req.query.before as string),
      limit: parseInt(req.query.limit as string),
      selectedFields: req.query.selectedFields as string,
    });

    res.status(200).json({
      status: 'success',
      data: { chats: chats.map((chat: GetChatResponse) => mapGetResponse(chat)) },
      message: 'Chats are fetched successfully',
    });
  }
);
