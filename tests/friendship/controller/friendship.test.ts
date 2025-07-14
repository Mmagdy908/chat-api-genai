import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as friendshipController from '../../../src/controllers/http/friendshipController';
import * as friendshipSchemas from '../../../src/schemas/friendshipSchemas';
import * as friendshipService from '../../../src/services/friendshipService';
import { Friendship_Status } from '../../../src/enums/friendshipEnums';
import { AppError } from '../../../src/util/appError';
import friendshipModel from '../../../src/models/friendship';

jest.mock('../../../src/services/friendshipService');

describe('Friendship Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  const senderId = new mongoose.Types.ObjectId().toString();
  const recipientId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    req = getMockReq({
      user: { id: senderId },
    });
    ({ res, next } = getMockRes());
  });

  describe('sendFriendRequest', () => {
    test('should send a friend request and return 201', async () => {
      req.body = { recipientId };

      const friendship = new friendshipModel({
        sender: senderId,
        recipient: recipientId,
      });

      jest.mocked(friendshipService.send).mockResolvedValue(friendship);
      jest.spyOn(friendshipSchemas, 'mapSendResponse').mockReturnValue(friendship);

      await friendshipController.sendFriendRequest(req as Request, res as Response, next);

      expect(friendshipService.send).toHaveBeenCalledWith(senderId, recipientId);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { friendship },
        message: 'A friend request is sent',
      });
    });

    test('should call next with an error if service throws', async () => {
      req.body = { recipientId };
      const error = new AppError(404, 'Recipient not found');
      jest.mocked(friendshipService.send).mockImplementation(() => {
        throw error;
      });

      await friendshipController.sendFriendRequest(req as Request, res as Response, next);

      expect(friendshipService.send).toHaveBeenCalledWith(senderId, recipientId);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('respondToFriendRequest', () => {
    test('should respond to a friend request and return 200', async () => {
      const newFriendship = new friendshipModel({
        sender: senderId,
        recipient: recipientId,
        status: Friendship_Status.Accepted,
      });
      const friendshipId = newFriendship.id.toString();
      req.body = { friendshipId, status: Friendship_Status.Accepted };

      jest.mocked(friendshipService.respond).mockResolvedValue(newFriendship);
      jest.spyOn(friendshipSchemas, 'mapRespondResponse').mockReturnValue(newFriendship);

      await friendshipController.respondToFriendRequest(req as Request, res as Response, next);

      expect(friendshipService.respond).toHaveBeenCalledWith(
        friendshipId,
        senderId,
        Friendship_Status.Accepted
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { friendship: newFriendship },
        message: `Friend request is ${Friendship_Status.Accepted}`,
      });
    });

    test('should call next with an error if service throws', async () => {
      const friendshipId = new mongoose.Types.ObjectId().toString();
      req.body = { friendshipId, status: Friendship_Status.Accepted };
      const error = new AppError(403, 'Not the recipient');
      jest.mocked(friendshipService.respond).mockImplementation(() => {
        throw error;
      });

      await friendshipController.respondToFriendRequest(req as Request, res as Response, next);

      expect(friendshipService.respond).toHaveBeenCalledWith(
        friendshipId,
        senderId,
        Friendship_Status.Accepted
      );
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
