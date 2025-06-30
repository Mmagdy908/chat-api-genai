import { Request, Response, NextFunction } from 'express';
import catchAsync from '../util/catchAsync';
import * as friendshipSchema from '../schemas/friendshipSchemas';
import * as friendshipService from '../services/friendshipService';

export const sendFriendRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recipientId } = friendshipSchema.sendFriendshipRequestSchema.parse(req.body);

    const friendship = friendshipSchema.sendFriendshipResponseSchema.parse(
      await friendshipService.send(req.user.id, recipientId)
    );

    res
      .status(201)
      .json({ status: 'success', data: { friendship }, message: 'A friend request is sent' });
  }
);

export const respondToFriendRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { friendshipId, status } = friendshipSchema.respondToFriendshipRequestSchema.parse(
      req.body
    );

    const newFriendship = friendshipSchema.respondToFriendshipResponseSchema.parse(
      await friendshipService.respond(friendshipId, req.user.id, status)
    );

    res.status(200).json({
      status: 'success',
      data: { friendship: newFriendship },
      message: `Friend request is ${status}`,
    });
  }
);
