import { jest, describe, expect, test, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { mongoConfig, clearMongoDB, disconnectMongoDB } from '../../src/config/mongo';
import friendshipModel from '../../src/models/friendship';
import { friendshipFactory } from '../utils/friendshipFactory';
import { Friendship_Status } from '../../src/enums/friendshipEnums';

describe('Friendship Model', () => {
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
    test('should create a valid friendship with all required fields', async () => {
      // Arrange
      const validFriendshipData = friendshipFactory.create();

      // Act
      const friendship = new friendshipModel(validFriendshipData);
      const savedFriendship = await friendship.save();

      // Assert
      expect(savedFriendship._id).toBeDefined();
      expect(savedFriendship.sender.toString()).toBe(validFriendshipData.sender?.toString());
      expect(savedFriendship.recipient.toString()).toBe(validFriendshipData.recipient?.toString());
      expect(savedFriendship.status).toBe(validFriendshipData.status);
      expect(savedFriendship.createdAt).toBeDefined();
      expect(savedFriendship.updatedAt).toBeDefined();
    });

    test('should fail validation when sender is missing', async () => {
      // Arrange
      const invalidFriendshipData = friendshipFactory.createWithMissingFields('sender');

      // Act & Assert
      const friendship = new friendshipModel(invalidFriendshipData);
      await expect(friendship.save()).rejects.toThrow('A friendship must have a sender');
    });

    test('should fail validation when recipient is missing', async () => {
      // Arrange
      const invalidFriendshipData = friendshipFactory.createWithMissingFields('recipient');

      // Act & Assert
      const friendship = new friendshipModel(invalidFriendshipData);
      await expect(friendship.save()).rejects.toThrow('A friendship must have a recipient');
    });

    test('should fail validation with invalid status', async () => {
      // Arrange
      const invalidFriendshipData = friendshipFactory.create();

      // Act & Assert
      const friendship = new friendshipModel({ ...invalidFriendshipData, status: 'InvalidStatus' });
      await expect(friendship.save()).rejects.toThrow(
        'Friendship status must be either Accepted, Rejected or Pending'
      );
    });

    // test('should enforce unique sender-recipient pair constraint', async () => {
    //   // Arrange
    //   const friendshipData1 = friendshipFactory.create();
    //   const friendshipData2 = friendshipFactory.create({
    //     sender: friendshipData1.sender,
    //     recipient: friendshipData1.recipient,
    //   });
    //   const friendshipData3 = friendshipFactory.create({
    //     sender: friendshipData1.recipient,
    //     recipient: friendshipData1.sender,
    //   });

    //   // Act
    //   const friendship1 = new friendshipModel(friendshipData1);
    //   await friendship1.save();

    //   const friendship2 = new friendshipModel(friendshipData2);
    //   const friendship3 = new friendshipModel(friendshipData3);

    //   // Assert
    //   await expect(friendship2.save()).rejects.toThrow('duplicate key error');
    //   await expect(friendship3.save()).rejects.toThrow('duplicate key error');
    // });
  });

  describe('Default Values', () => {
    test('should set status to Pending by default', async () => {
      // Arrange
      const friendshipData = friendshipFactory.createWithMissingFields('status');

      // Act
      const friendship = new friendshipModel(friendshipData);
      const savedFriendship = await friendship.save();

      // Assert
      expect(savedFriendship.status).toBe(Friendship_Status.Pending);
    });

    test('should allow status to be set explicitly', async () => {
      // Arrange
      const friendshipData = friendshipFactory.create({ status: Friendship_Status.Accepted });

      // Act
      const friendship = new friendshipModel(friendshipData);
      const savedFriendship = await friendship.save();

      // Assert
      expect(savedFriendship.status).toBe(Friendship_Status.Accepted);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      // Arrange
      const friendshipData = friendshipFactory.create();

      // Act
      const friendship = new friendshipModel(friendshipData);
      const savedFriendship = await friendship.save();

      // Assert
      expect(savedFriendship.createdAt).toBeDefined();
      expect(savedFriendship.updatedAt).toBeDefined();
      expect(savedFriendship.createdAt).toBeInstanceOf(Date);
      expect(savedFriendship.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt when document is modified', async () => {
      // Arrange
      const friendshipData = friendshipFactory.create();

      const friendship = new friendshipModel(friendshipData);
      const savedFriendship = await friendship.save();
      const originalUpdatedAt = savedFriendship.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Act
      savedFriendship.status = Friendship_Status.Accepted;
      const updatedFriendship = await savedFriendship.save();

      // Assert
      expect(updatedFriendship.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Virtual Properties', () => {
    test('should include virtuals in JSON output', async () => {
      // Arrange
      const friendshipData = friendshipFactory.create();

      // Act
      const friendship = new friendshipModel(friendshipData);
      const savedFriendship = await friendship.save();
      const friendshipJSON = savedFriendship.toJSON();

      // Assert
      expect(friendshipJSON).toHaveProperty('id');
      expect(friendshipJSON).toHaveProperty('sender');
      expect(friendshipJSON).toHaveProperty('recipient');
      expect(friendshipJSON).toHaveProperty('status');
      expect(friendshipJSON).toHaveProperty('createdAt');
      expect(friendshipJSON).toHaveProperty('updatedAt');
    });

    test('should include virtuals in Object output', async () => {
      // Arrange
      const friendshipData = friendshipFactory.create();

      // Act
      const friendship = new friendshipModel(friendshipData);
      const savedFriendship = await friendship.save();
      const friendshipObject = savedFriendship.toObject();

      // Assert
      expect(friendshipObject).toHaveProperty('id');
      expect(friendshipObject).toHaveProperty('sender');
      expect(friendshipObject).toHaveProperty('recipient');
      expect(friendshipObject).toHaveProperty('status');
      expect(friendshipObject).toHaveProperty('createdAt');
      expect(friendshipObject).toHaveProperty('updatedAt');
    });
  });
});
