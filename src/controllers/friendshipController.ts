import { Request, Response, NextFunction } from 'express';
import catchAsync from '../util/catchAsync';
import * as friendshipSchema from '../schemas/friendshipSchemas';
import * as friendshipService from '../services/friendshipService';
import { Friendship } from '../interfaces/models/friendship';

export const sendFriendRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recipientId } = friendshipSchema.mapSendRequest(req.body);

    const friendship = friendshipSchema.mapSendResponse(
      await friendshipService.send(req.user.id, recipientId)
    );

    res
      .status(201)
      .json({ status: 'success', data: { friendship }, message: 'A friend request is sent' });
  }
);

export const respondToFriendRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { friendshipId, status } = friendshipSchema.mapRespondRequest(req.body);

    const newFriendship = friendshipSchema.mapRespondResponse(
      (await friendshipService.respond(friendshipId, req.user.id, status)) as Friendship
    );

    res.status(200).json({
      status: 'success',
      data: { friendship: newFriendship },
      message: `Friend request is ${status}`,
    });
  }
);
