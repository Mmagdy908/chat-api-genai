import { jest, describe, expect, test, beforeEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import friendshipModel from '../../../src/models/friendship';
import chatModel from '../../../src/models/chat';
import { setupUser } from '../../utils/userFactory';
import { Friendship_Status } from '../../../src/enums/friendshipEnums';
import { User } from '../../../src/interfaces/models/user';
import { Friendship } from '../../../src/interfaces/models/friendship';
import { Chat_Type } from '../../../src/enums/chatEnums';

describe('Friendship Routes', () => {
  let sender: User;
  let recipient: User;
  let senderToken: string;
  let recipientToken: string;
  setupIntegrationTests();

  beforeEach(async () => {
    // Arrange
    ({ user: sender, accessToken: senderToken } = await setupUser({
      username: 'sender',
      email: 'sender@example.com',
      isVerified: true,
    }));

    ({ user: recipient, accessToken: recipientToken } = await setupUser({
      username: 'recipient',
      email: 'recipient@example.com',
      isVerified: true,
    }));
  });

  describe('POST /friendships/send', () => {
    test('should fail with 401 if user is not authenticated', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/friendships/send')
        .send({ recipientId: recipient.id })
        .expect(401);

      // Assert
      expect(response.body.message).toBe('You are not logged in');
    });

    test('should successfully send a friend request and return 201', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/friendships/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: recipient.id })
        .expect(201);

      // Assert
      expect(response.body.status).toBe('success');
      expect(response.body.data.friendship.sender).toBe(sender.id);
      expect(response.body.data.friendship.recipient).toBe(recipient.id);
      expect(response.body.data.friendship.status).toBe(Friendship_Status.Pending);

      const friendshipInDb = await friendshipModel.findById(response.body.data.friendship.id);
      expect(friendshipInDb).toBeDefined();
    });

    test('should fail with 400 if sending to self', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/friendships/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: sender.id })
        .expect(400);

      // Assert
      expect(response.body.message).toBe('You cannot send a friend request to yourself');
    });

    test('should fail with 400 if recipientId is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/friendships/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({})
        .expect(400);

      // Assert
      expect(response.body.message).toBe(
        '(recipientId) Invalid input: expected string, received undefined'
      );
    });

    test('should fail with 404 if recipient does not exist', async () => {
      // Arrange
      const nonExistentId = '605fe2a754a4443834416344';

      // Act
      const response = await request(app)
        .post('/api/v1/friendships/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: nonExistentId })
        .expect(404);

      // Assert
      expect(response.body.message).toBe('This recipient is not found');
    });

    test('should fail with 400 if friendship already exists', async () => {
      // Arrange
      await friendshipModel.create({
        sender: sender.id,
        recipient: recipient.id,
      });

      // Act
      const response1 = await request(app)
        .post('/api/v1/friendships/send')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ recipientId: recipient.id })
        .expect(400);

      const response2 = await request(app)
        .post('/api/v1/friendships/send')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({ recipientId: sender.id })
        .expect(400);

      // Assert
      expect(response1.body.message).toBe('This Friendship already exists');
      expect(response2.body.message).toBe('This Friendship already exists');
    });
  });

  describe('PATCH /friendships/respond', () => {
    let friendshipRequest: Friendship;
    beforeEach(async () => {
      // Arrange
      friendshipRequest = await friendshipModel.create({
        sender: sender.id,
        recipient: recipient.id,
      });
    });

    test('should fail with 401 if user is not authenticated', async () => {
      // Act
      const response = await request(app)
        .patch('/api/v1/friendships/respond')
        .send({ friendshipId: friendshipRequest.id, status: Friendship_Status.Accepted })
        .expect(401);

      // Assert
      expect(response.body.message).toBe('You are not logged in');
    });

    test('should fail with 400 if friendshipId is missing', async () => {
      // Act
      const response = await request(app)
        .patch('/api/v1/friendships/respond')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ status: Friendship_Status.Accepted })
        .expect(400);

      // Assert
      expect(response.body.message).toBe(
        '(friendshipId) Invalid input: expected string, received undefined'
      );
    });

    test('should fail with 403 if the wrong user tries to respond', async () => {
      // Act
      const response = await request(app)
        .patch('/api/v1/friendships/respond')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ friendshipId: friendshipRequest.id, status: Friendship_Status.Accepted })
        .expect(403);

      // Assert
      expect(response.body.message).toBe('Current user is not recipient of this friend request');
    });

    test('should successfully accept a friend request and return 200', async () => {
      // Act
      const response = await request(app)
        .patch('/api/v1/friendships/respond')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({ friendshipId: friendshipRequest.id, status: Friendship_Status.Accepted })
        .expect(200);

      // Assert
      expect(response.body.status).toBe('success');
      expect(response.body.data.friendship.status).toBe(Friendship_Status.Accepted);
      const friendshipInDb = await friendshipModel.findById(friendshipRequest.id);
      expect(friendshipInDb?.status).toBe(Friendship_Status.Accepted);

      // check private chat creation
      const members = [friendshipRequest.sender, friendshipRequest.recipient];
      const chatInDb = await chatModel.findOne({
        members: { $all: members },
      });

      expect(chatInDb?.type).toBe(Chat_Type.Private);
      expect(chatInDb?.members.sort()).toEqual(members.sort());
    });

    test('should fail with 400 if trying to respond to an already accepted/rejected request', async () => {
      // Arrange
      friendshipRequest = (await friendshipModel.findByIdAndUpdate(
        friendshipRequest.id,
        {
          status: Friendship_Status.Accepted,
        },
        { new: true }
      )) as Friendship;

      // Act
      const response = await request(app)
        .patch('/api/v1/friendships/respond')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({ friendshipId: friendshipRequest.id, status: Friendship_Status.Rejected })
        .expect(400);

      // Assert
      expect(response.body.message).toBe('This friendship is not Pending');
    });

    test('should successfully reject a friend request', async () => {
      // Create a new request to test rejection

      // Act
      const response = await request(app)
        .patch('/api/v1/friendships/respond')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({ friendshipId: friendshipRequest.id, status: Friendship_Status.Rejected })
        .expect(200);

      // Assert
      expect(response.body.status).toBe('success');
      expect(response.body.data.friendship.status).toBe(Friendship_Status.Rejected);
      const friendshipInDb = await friendshipModel.findById(friendshipRequest.id);
      expect(friendshipInDb?.status).toBe(Friendship_Status.Rejected);

      // check private chat creation
      const members = [friendshipRequest.sender, friendshipRequest.recipient];
      const chatInDb = await chatModel.findOne({
        members: { $all: members },
      });

      expect(chatInDb).toBeNull();
    });
  });
});
