import { jest, describe, expect, test, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { mongoConfig, clearMongoDB, disconnectMongoDB } from '../../src/config/mongo';
import notificationModel from '../../src/models/notification';
import { notificationFactory } from '../utils/notificationFactory';
import {
  Notification_Status,
  Notification_Type,
  Reference_Type,
} from '../../src/enums/notificationEnums';
import userModel from '../../src/models/user';
import friendshipModel from '../../src/models/friendship';
import { userFactory } from '../utils/userFactory';
import { friendshipFactory } from '../utils/friendshipFactory';

describe('Notification Model', () => {
  beforeAll(async () => {
    await mongoConfig();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    await clearMongoDB();
  });

  afterAll(async () => {
    await disconnectMongoDB();
  });

  describe('Schema Validation', () => {
    test('should create a valid notification with required fields', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const recipient = await new userModel(
        userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
      ).save();
      const friendship = await new friendshipModel(
        friendshipFactory.create({ sender: sender.id, recipient: recipient.id })
      ).save();
      const validNotificationData = notificationFactory.create({
        type: Notification_Type.Received_Friend_Request,
        sender: sender.id,
        recipient: recipient.id,
        reference: friendship.id,
        referenceType: Reference_Type.Friendship,
      });

      // Act
      const notification = new notificationModel(validNotificationData);
      const savedNotification = await notification.save();

      // Assert
      expect(savedNotification.id).toBeDefined();
      expect(savedNotification.type).toBe(Notification_Type.Received_Friend_Request);
      expect(savedNotification.sender.toString()).toBe(sender.id.toString());
      expect(savedNotification.recipient.toString()).toBe(recipient.id.toString());
      expect(savedNotification.reference.toString()).toBe(friendship.id.toString());
      expect(savedNotification.referenceType).toBe(Reference_Type.Friendship);
      expect(savedNotification.status).toBe(Notification_Status.Unread);
      expect(savedNotification.createdAt).toBeDefined();
      expect(savedNotification.updatedAt).toBeDefined();
    });

    test('should fail validation when type is missing', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const recipient = await new userModel(
        userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
      ).save();
      const friendship = await new friendshipModel(
        friendshipFactory.create({ sender: sender.id, recipient: recipient.id })
      ).save();
      const invalidNotificationData = notificationFactory.createWithMissingFields('type');

      // Act & Assert
      const notification = new notificationModel(invalidNotificationData);
      await expect(notification.save()).rejects.toThrow('A notification must have a type');
    });

    test('should fail validation when sender is missing', async () => {
      // Arrange
      const recipient = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const friendship = await new friendshipModel(friendshipFactory.create()).save();
      const invalidNotificationData = notificationFactory.createWithMissingFields('sender');

      // Act & Assert
      const notification = new notificationModel(invalidNotificationData);
      await expect(notification.save()).rejects.toThrow('A notification must have a sender');
    });

    test('should fail validation when recipient is missing', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const friendship = await new friendshipModel(friendshipFactory.create()).save();
      const invalidNotificationData = notificationFactory.createWithMissingFields('recipient');

      // Act & Assert
      const notification = new notificationModel(invalidNotificationData);
      await expect(notification.save()).rejects.toThrow('A notification must have a receiver');
    });

    test('should fail validation when reference is missing', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const recipient = await new userModel(
        userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
      ).save();
      const invalidNotificationData = notificationFactory.createWithMissingFields('reference');

      // Act & Assert
      const notification = new notificationModel(invalidNotificationData);
      await expect(notification.save()).rejects.toThrow('A notification must have a reference');
    });

    test('should fail validation with invalid notification type', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const recipient = await new userModel(
        userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
      ).save();
      const friendship = await new friendshipModel(friendshipFactory.create()).save();
      const invalidNotificationData = notificationFactory.create({
        type: 'InvalidType' as Notification_Type,
        sender: sender.id,
        recipient: recipient.id,
        reference: friendship.id,
        referenceType: Reference_Type.Friendship,
      });

      // Act & Assert
      const notification = new notificationModel(invalidNotificationData);
      await expect(notification.save()).rejects.toThrow(
        'Notification type must be either received_friend_request or accepted_friend_request'
      );
    });

    test('should fail validation with invalid reference type', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const recipient = await new userModel(
        userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
      ).save();
      const friendship = await new friendshipModel(friendshipFactory.create()).save();
      const invalidNotificationData = notificationFactory.create({
        type: Notification_Type.Received_Friend_Request,
        sender: sender.id,
        recipient: recipient.id,
        reference: friendship.id,
        referenceType: 'InvalidReference' as Reference_Type,
      });

      // Act & Assert
      const notification = new notificationModel(invalidNotificationData);
      await expect(notification.save()).rejects.toThrow(
        'Notification status must be either Friendship or ...'
      );
    });
  });

  describe('Default Values', () => {
    test('should set status to Unread by default', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const recipient = await new userModel(
        userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
      ).save();
      const friendship = await new friendshipModel(friendshipFactory.create()).save();
      const notificationData = notificationFactory.createWithMissingFields('status');

      // Act
      const notification = new notificationModel(notificationData);
      const savedNotification = await notification.save();

      // Assert
      expect(savedNotification.status).toBe(Notification_Status.Unread);
    });

    test('should allow status to be set explicitly', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const recipient = await new userModel(
        userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
      ).save();
      const friendship = await new friendshipModel(friendshipFactory.create()).save();
      const notificationData = notificationFactory.create({
        type: Notification_Type.Received_Friend_Request,
        sender: sender.id,
        recipient: recipient.id,
        reference: friendship.id,
        referenceType: Reference_Type.Friendship,
        status: Notification_Status.Read,
      });

      // Act
      const notification = new notificationModel(notificationData);
      const savedNotification = await notification.save();

      // Assert
      expect(savedNotification.status).toBe(Notification_Status.Read);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const recipient = await new userModel(
        userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
      ).save();
      const friendship = await new friendshipModel(friendshipFactory.create()).save();
      const notificationData = notificationFactory.create({
        type: Notification_Type.Received_Friend_Request,
        sender: sender.id,
        recipient: recipient.id,
        reference: friendship.id,
        referenceType: Reference_Type.Friendship,
      });

      // Act
      const notification = new notificationModel(notificationData);
      const savedNotification = await notification.save();

      // Assert
      expect(savedNotification.createdAt).toBeDefined();
      expect(savedNotification.updatedAt).toBeDefined();
      expect(savedNotification.createdAt).toBeInstanceOf(Date);
      expect(savedNotification.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt when document is modified', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const recipient = await new userModel(
        userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
      ).save();
      const friendship = await new friendshipModel(friendshipFactory.create()).save();
      const notificationData = notificationFactory.create({
        type: Notification_Type.Received_Friend_Request,
        sender: sender.id,
        recipient: recipient.id,
        reference: friendship.id,
        referenceType: Reference_Type.Friendship,
      });

      const notification = new notificationModel(notificationData);
      const savedNotification = await notification.save();
      const originalUpdatedAt = savedNotification.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Act
      savedNotification.status = Notification_Status.Read;
      const updatedNotification = await savedNotification.save();

      // Assert
      expect(updatedNotification.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Virtual Properties', () => {
    test('should include virtuals in JSON output', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const recipient = await new userModel(
        userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
      ).save();
      const friendship = await new friendshipModel(friendshipFactory.create()).save();
      const notificationData = notificationFactory.create({
        type: Notification_Type.Received_Friend_Request,
        sender: sender.id,
        recipient: recipient.id,
        reference: friendship.id,
        referenceType: Reference_Type.Friendship,
      });

      // Act
      const notification = new notificationModel(notificationData);
      const savedNotification = await notification.save();
      const notificationJSON = savedNotification.toJSON();

      // Assert
      expect(notificationJSON).toHaveProperty('id');
      expect(notificationJSON).toHaveProperty('type');
      expect(notificationJSON).toHaveProperty('sender');
      expect(notificationJSON).toHaveProperty('recipient');
      expect(notificationJSON).toHaveProperty('status');
      expect(notificationJSON).toHaveProperty('reference');
      expect(notificationJSON).toHaveProperty('referenceType');
      expect(notificationJSON).toHaveProperty('createdAt');
      expect(notificationJSON).toHaveProperty('updatedAt');
    });

    test('should include virtuals in Object output', async () => {
      // Arrange
      const sender = await new userModel(
        userFactory.create({ username: 'sender', email: 'sender@example.com' })
      ).save();
      const recipient = await new userModel(
        userFactory.create({ username: 'recipient', email: 'recipient@example.com' })
      ).save();
      const friendship = await new friendshipModel(friendshipFactory.create()).save();
      const notificationData = notificationFactory.create({
        type: Notification_Type.Received_Friend_Request,
        sender: sender.id,
        recipient: recipient.id,
        reference: friendship.id,
        referenceType: Reference_Type.Friendship,
      });

      // Act
      const notification = new notificationModel(notificationData);
      const savedNotification = await notification.save();
      const notificationObject = savedNotification.toObject();

      // Assert
      expect(notificationObject).toHaveProperty('id');
      expect(notificationObject).toHaveProperty('type');
      expect(notificationObject).toHaveProperty('sender');
      expect(notificationObject).toHaveProperty('recipient');
      expect(notificationObject).toHaveProperty('status');
      expect(notificationObject).toHaveProperty('reference');
      expect(notificationObject).toHaveProperty('referenceType');
      expect(notificationObject).toHaveProperty('createdAt');
      expect(notificationObject).toHaveProperty('updatedAt');
    });
  });
});
