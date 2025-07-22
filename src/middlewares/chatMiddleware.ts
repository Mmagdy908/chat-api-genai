import { Request, Response, NextFunction } from 'express';
import * as chatRepository from '../repositories/chatRepository';
import { AppError } from '../util/appError';
import catchAsync from '../util/catchAsync';
import { toObjectId } from '../util/objectIdUtil';
import { Chat_Type } from '../enums/chatEnums';

export const isGroupChatAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const chat = await chatRepository.getById(req.params.chatId);

    if (!chat) return next(new AppError(404, 'Chat not found'));

    if (chat.type !== Chat_Type.Group) return next(new AppError(400, 'This chat is not a group'));

    if (
      ![chat.owner.toString(), ...chat.admins.map((admin) => admin.toString())].includes(
        req.user.id
      )
    )
      return next(new AppError(403, 'Logged In User is not an admin of this chat'));

    req.chat = chat;

    next();
  }
);

export const isChatMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const chat = await chatRepository.getById(req.params.chatId);

    if (!chat) return next(new AppError(404, 'Chat not found'));

    if (!chat.members.map((member) => member.toString()).includes(req.user.id))
      return next(new AppError(403, 'Logged In User is not a member of this chat'));

    req.chat = chat;

    next();
  }
);
