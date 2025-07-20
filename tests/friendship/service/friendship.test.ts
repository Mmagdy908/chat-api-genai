import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import * as friendshipService from '../../../src/services/friendshipService';
import * as userRepository from '../../../src/repositories/userRepository';
import * as friendshipRepository from '../../../src/repositories/friendshipRepository';
import * as chatRepository from '../../../src/repositories/chatRepository';
import * as userChatRepository from '../../../src/repositories/userChatRepository';
import { AppError } from '../../../src/util/appError';
import { Friendship_Status } from '../../../src/enums/friendshipEnums';
import { userFactory } from '../../utils/userFactory';
import { friendshipFactory } from '../../utils/friendshipFactory';
import userModel from '../../../src/models/user';
import friendshipModel from '../../../src/models/friendship';
import { toObjectId } from '../../../src/util/objectIdUtil';
import { User } from '../../../src/interfaces/models/user';
import { Friendship } from '../../../src/interfaces/models/friendship';

jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/repositories/friendshipRepository');
jest.mock('../../../src/repositories/chatRepository');
jest.mock('../../../src/repositories/userChatRepository');

describe('Friendship Service', () => {
  let sender: User;
  let recipient: User;

  beforeEach(() => {
    jest.clearAllMocks();
    sender = new userModel(userFactory.create({ username: 'sender', email: 'sender@example.com' }));
    recipient = new userModel(
      userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
    );
  });

  describe('send', () => {
    test('should send a friend request successfully', async () => {
      jest.mocked(userRepository.getById).mockResolvedValue(recipient);
      jest.mocked(friendshipRepository.getBySenderRecipientId).mockResolvedValue(null);

      const createdFriendship = new friendshipModel(
        friendshipFactory.create({
          sender: sender.id.toString(),
          recipient: recipient.id.toString(),
        })
      );
      jest.mocked(friendshipRepository.create).mockResolvedValue(createdFriendship);

      const result = await friendshipService.send(sender.id.toString(), recipient.id.toString());

      expect(userRepository.getById).toHaveBeenCalledWith(recipient.id.toString());
      expect(friendshipRepository.getBySenderRecipientId).toHaveBeenCalledWith(
        sender.id.toString(),
        recipient.id.toString()
      );
      expect(friendshipRepository.create).toHaveBeenCalledWith({
        sender: toObjectId(sender.id),
        recipient: toObjectId(recipient.id),
      });
      expect(result).toEqual(createdFriendship);
    });

    test('should throw 400 error if sending request to oneself', async () => {
      await expect(friendshipService.send(sender.id, sender.id)).rejects.toThrow(
        new AppError(400, 'You cannot send a friend request to yourself')
      );
    });

    test('should throw 404 error if recipient is not found', async () => {
      jest.mocked(userRepository.getById).mockResolvedValue(null);

      await expect(friendshipService.send(sender.id, recipient.id)).rejects.toThrow(
        new AppError(404, 'This recipient is not found')
      );
    });

    test('should throw 400 error if friendship already exists', async () => {
      jest.mocked(userRepository.getById).mockResolvedValue(recipient);
      jest.mocked(friendshipRepository.getBySenderRecipientId).mockResolvedValue({} as any);

      await expect(friendshipService.send(sender.id, recipient.id)).rejects.toThrow(
        new AppError(400, 'This Friendship already exists')
      );
    });
  });

  describe('respond', () => {
    let pendingFriendship: any;

    beforeEach(() => {
      pendingFriendship = new friendshipModel({
        sender: sender.id,
        recipient: recipient.id,
        status: Friendship_Status.Pending,
      });
    });

    test('should respond to a friend request successfully', async () => {
      jest.mocked(friendshipRepository.getById).mockResolvedValue(pendingFriendship);
      const updatedFriendship = { ...pendingFriendship.toObject(), status: 'Accepted' };
      jest.mocked(friendshipRepository.updateById).mockResolvedValue(updatedFriendship as any);
      jest.mocked(chatRepository.createPrivateChat).mockResolvedValue({ id: 'chat123' } as any);
      jest.mocked(userChatRepository.create);

      const result = (await friendshipService.respond(
        pendingFriendship.id,
        recipient.id,
        Friendship_Status.Accepted
      )) as Friendship;

      expect(friendshipRepository.getById).toHaveBeenCalledWith(pendingFriendship.id);
      expect(friendshipRepository.updateById).toHaveBeenCalledWith(pendingFriendship.id, {
        status: Friendship_Status.Accepted,
      });
      expect(chatRepository.createPrivateChat).toHaveBeenCalledWith([
        pendingFriendship.sender.toString(),
        pendingFriendship.recipient.toString(),
      ]);
      expect(userChatRepository.create).toHaveBeenCalledWith(
        pendingFriendship.sender.toString(),
        'chat123'
      );
      expect(userChatRepository.create).toHaveBeenCalledWith(
        pendingFriendship.recipient.toString(),
        'chat123'
      );
      expect(result.status).toBe(Friendship_Status.Accepted);
    });

    test('should throw 404 error if friendship is not found', async () => {
      jest.mocked(friendshipRepository.getById).mockResolvedValue(null);

      await expect(
        friendshipService.respond(pendingFriendship.id, recipient.id, Friendship_Status.Accepted)
      ).rejects.toThrow(new AppError(404, 'This friendship is not found'));
    });

    test('should throw 403 error if user is not the recipient', async () => {
      jest.mocked(friendshipRepository.getById).mockResolvedValue(pendingFriendship);
      const wrongUserId = new mongoose.Types.ObjectId().toString();

      await expect(
        friendshipService.respond(pendingFriendship.id, wrongUserId, Friendship_Status.Accepted)
      ).rejects.toThrow(new AppError(403, 'Current user is not recipient of this friend request'));
    });

    test('should throw 400 error if friendship is not pending', async () => {
      const acceptedFriendship = new friendshipModel({
        ...pendingFriendship.toObject(),
        status: Friendship_Status.Accepted,
      });
      jest.mocked(friendshipRepository.getById).mockResolvedValue(acceptedFriendship);

      await expect(
        friendshipService.respond(acceptedFriendship.id, recipient.id, Friendship_Status.Accepted)
      ).rejects.toThrow(new AppError(400, 'This friendship is not Pending'));
    });
  });
});
