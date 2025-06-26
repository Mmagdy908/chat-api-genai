import { Request, Response, NextFunction } from 'express';
import catchAsync from '../util/catchAsync';
import checkRequiredFields from '../util/checkRequiredFields';
import * as friendshipSchema from '../schemas/friendshipSchemas';
import * as friendshipService from '../services/friendshipService';

export const sendFriendRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recipientId } = friendshipSchema.createFriendshipRequestSchema.parse(req.body);

    const friendship = friendshipSchema.createFriendshipResponseSchema.parse(
      await friendshipService.createFriendRequest(req.user.id, recipientId)
    );

    res
      .status(201)
      .json({ status: 'success', data: { friendship }, message: 'A friend request is sent' });
  }
);
