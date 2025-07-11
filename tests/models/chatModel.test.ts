import { jest, describe, expect, test, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { mongoConfig, clearMongoDB, disconnectMongoDB } from '../../src/config/mongo';
import chatModel from '../../src/models/chat';
import { chatFactory } from '../utils/chatFactory';
import { Chat_Type } from '../../src/enums/chatEnums';
import { userFactory } from '../utils/userFactory';
import userModel from '../../src/models/user';

describe('Chat Model', () => {
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
    test('should create a valid private chat with required fields', async () => {
      // Arrange
      const user1 = await new userModel(
        userFactory.create({ email: 'user1@example.com', username: 'user1' })
      ).save();
      const user2 = await new userModel(
        userFactory.create({ email: 'user2@example.com', username: 'user2' })
      ).save();

      const validChatData = chatFactory.create({
        type: Chat_Type.Private,
        members: [user1.id, user2.id],
      });

      // Act
      const chat = new chatModel(validChatData);
      const savedChat = await chat.save();

      // Assert
      expect(savedChat.id).toBeDefined();
      expect(savedChat.type).toBe(validChatData.type);
      expect(savedChat.members).toHaveLength(2);
      expect(savedChat.members[0].toString()).toBe(user1.id);
      expect(savedChat.members[1].toString()).toBe(user2.id);
      expect(savedChat.createdAt).toBeDefined();
      expect(savedChat.updatedAt).toBeDefined();
    });

    test('should create a valid group chat with metaData', async () => {
      // Arrange
      const user1 = await new userModel(userFactory.create()).save();
      const validChatData = chatFactory.create({
        type: Chat_Type.Group,
        members: [user1.id],
        metaData: {
          name: 'Test Group',
          description: 'Test group description',
          image: 'http://example.com/image.jpg',
        },
      });

      // Act
      const chat = new chatModel(validChatData);
      const savedChat = await chat.save();

      // Assert
      expect(savedChat.id).toBeDefined();
      expect(savedChat.type).toBe(Chat_Type.Group);
      expect(savedChat.metaData.name).toBe('Test Group');
      expect(savedChat.metaData.description).toBe('Test group description');
      expect(savedChat.metaData.image).toBe('http://example.com/image.jpg');
    });

    test('should fail validation when members array is empty', async () => {
      // Arrange
      const invalidChatData = chatFactory.create({ members: [] });

      // Act & Assert
      const chat = new chatModel(invalidChatData);
      await expect(chat.save()).rejects.toThrow(
        'A private chat must have at least two members and a group chat must have at least one member'
      );
    });

    test('should fail validation with invalid chat type', async () => {
      // Arrange
      const user1 = await new userModel(
        userFactory.create({ email: 'user1@example.com', username: 'user1' })
      ).save();
      const user2 = await new userModel(
        userFactory.create({ email: 'user2@example.com', username: 'user2' })
      ).save();

      const invalidChatData = chatFactory.create({
        type: 'InvalidType' as Chat_Type,
        members: [user1.id, user2.id],
      });

      // Act & Assert
      const chat = new chatModel(invalidChatData);
      await expect(chat.save()).rejects.toThrow('Chat type must be either Private or Group');
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      // Arrange
      const user1 = await new userModel(
        userFactory.create({ email: 'user1@example.com', username: 'user1' })
      ).save();
      const user2 = await new userModel(
        userFactory.create({ email: 'user2@example.com', username: 'user2' })
      ).save();

      const chatData = chatFactory.create({ members: [user1.id, user2.id] });

      // Act
      const chat = new chatModel(chatData);
      const savedChat = await chat.save();

      // Assert
      expect(savedChat.createdAt).toBeDefined();
      expect(savedChat.updatedAt).toBeDefined();
      expect(savedChat.createdAt).toBeInstanceOf(Date);
      expect(savedChat.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt when document is modified', async () => {
      // Arrange
      const user1 = await new userModel(
        userFactory.create({ email: 'user1@example.com', username: 'user1' })
      ).save();
      const user2 = await new userModel(
        userFactory.create({ email: 'user2@example.com', username: 'user2' })
      ).save();

      const chatData = chatFactory.create({ members: [user1.id, user2.id] });

      const chat = new chatModel(chatData);
      const savedChat = await chat.save();
      const originalUpdatedAt = savedChat.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Act
      savedChat.metaData.name = 'Updated Group Name';
      const updatedChat = await savedChat.save();

      // Assert
      expect(updatedChat.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Virtual Properties', () => {
    test('should include virtuals in JSON output', async () => {
      // Arrange
      const user1 = await new userModel(
        userFactory.create({ email: 'user1@example.com', username: 'user1' })
      ).save();
      const user2 = await new userModel(
        userFactory.create({ email: 'user2@example.com', username: 'user2' })
      ).save();

      const chatData = chatFactory.create({ members: [user1.id, user2.id] });

      // Act
      const chat = new chatModel(chatData);
      const savedChat = await chat.save();
      const chatJSON = savedChat.toJSON();

      // Assert
      expect(chatJSON).toHaveProperty('id');
      expect(chatJSON).toHaveProperty('type');
      expect(chatJSON).toHaveProperty('members');
      expect(chatJSON).toHaveProperty('createdAt');
      expect(chatJSON).toHaveProperty('updatedAt');
    });

    test('should include virtuals in Object output', async () => {
      // Arrange
      const user1 = await new userModel(
        userFactory.create({ email: 'user1@example.com', username: 'user1' })
      ).save();
      const user2 = await new userModel(
        userFactory.create({ email: 'user2@example.com', username: 'user2' })
      ).save();

      const chatData = chatFactory.create({ members: [user1.id, user2.id] });

      // Act
      const chat = new chatModel(chatData);
      const savedChat = await chat.save();
      const chatObject = savedChat.toObject();

      // Assert
      expect(chatObject).toHaveProperty('id');
      expect(chatObject).toHaveProperty('type');
      expect(chatObject).toHaveProperty('members');
      expect(chatObject).toHaveProperty('createdAt');
      expect(chatObject).toHaveProperty('updatedAt');
    });
  });
});
