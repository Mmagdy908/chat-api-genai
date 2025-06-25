import { Request, Response, NextFunction } from 'express';
import catchAsync from '../util/catchAsync';
import checkRequiredFields from '../util/checkRequiredFields';
import * as friendshipMapper from '../mappers/friendshipMapper';
import * as friendshipService from '../services/friendshipService';

export const sendFriendRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { recipientId } = friendshipMapper.mapCreateRequest(req.body);

    // checkRequiredFields(body, 'firstName', 'lastName', 'email', 'password');

    const friendship = friendshipMapper.mapCreateResponse(
      await friendshipService.createFriendRequest(req.user.id, recipientId)
    );

    res
      .status(201)
      .json({ status: 'success', data: { friendship }, message: 'A friend request is sent' });
  }
);
