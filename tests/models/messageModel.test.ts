import { jest, describe, expect, test, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { mongoConfig, clearMongoDB, disconnectMongoDB } from '../../src/config/mongo';
import messageModel from '../../src/models/message';
import { messageFactory } from '../utils/messageFactory';
import { Message_Status, Message_Type } from '../../src/enums/messageEnums';
import userModel from '../../src/models/user';
import chatModel from '../../src/models/chat';
import { userFactory } from '../utils/userFactory';
import { chatFactory } from '../utils/chatFactory';

describe('Message Model', () => {
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
    test('should create a valid text message with required fields', async () => {
      // Arrange
      const chat = await new chatModel(chatFactory.create()).save();
      const validMessageData = messageFactory.create({
        chat: chat.id,
        sender: chat.members[0].toString(),
        content: { contentType: Message_Type.Text, text: 'Hello, World!' },
      });

      // Act
      const message = new messageModel(validMessageData);
      const savedMessage = await message.save();

      // Assert
      expect(savedMessage.id).toBeDefined();
      expect(savedMessage.chat.toString()).toBe(chat.id.toString());
      expect(savedMessage.sender.toString()).toBe(chat.members[0].toString());
      expect(savedMessage.status).toBe(Message_Status.Sent);
      expect(savedMessage.content.contentType).toBe('Text');
      expect(savedMessage.content.text).toBe('Hello, World!');
      expect(savedMessage.createdAt).toBeDefined();
      expect(savedMessage.updatedAt).toBeDefined();
    });

    test('should create a valid media message', async () => {
      // Arrange
      const chat = await new chatModel(chatFactory.create()).save();
      const validMessageData = messageFactory.create({
        chat: chat.id,
        sender: chat.members[0].toString(),
        content: { contentType: Message_Type.Image, mediaUrl: 'http://example.com/image.jpg' },
      });

      // Act
      const message = new messageModel(validMessageData);
      const savedMessage = await message.save();

      // Assert
      expect(savedMessage.content.contentType).toBe('Image');
      expect(savedMessage.content.mediaUrl).toBe('http://example.com/image.jpg');
    });

    test('should fail validation when chat is missing', async () => {
      // Arrange
      const user = await new userModel(userFactory.create()).save();
      const invalidMessageData = messageFactory.createWithMissingFields('chat');

      // Act & Assert
      const message = new messageModel(invalidMessageData);
      await expect(message.save()).rejects.toThrow('A message must belong to a chat');
    });

    test('should fail validation with invalid content type', async () => {
      // Arrange
      const chat = await new chatModel(chatFactory.create()).save();
      const invalidMessageData = messageFactory.create({
        chat: chat.id,
        sender: chat.members[0].toString(),
        content: { contentType: 'InvalidType' as Message_Type, text: 'Hello' },
      });

      // Act & Assert
      const message = new messageModel(invalidMessageData);
      await expect(message.save()).rejects.toThrow(
        'Message type must be either Text, Image, Video, Audio or File'
      );
    });
  });

  describe('Default Values', () => {
    test('should set status to Sent by default', async () => {
      // Arrange
      const messageData = messageFactory.createWithMissingFields('status');

      // Act
      const message = new messageModel(messageData);
      const savedMessage = await message.save();

      // Assert
      expect(savedMessage.status).toBe(Message_Status.Sent);
    });

    test('should allow status to be set explicitly', async () => {
      // Arrange
      const chat = await new chatModel(chatFactory.create()).save();
      const messageData = messageFactory.create({
        chat: chat.id,
        sender: chat.members[0].toString(),
        status: Message_Status.Seen,
      });

      // Act
      const message = new messageModel(messageData);
      const savedMessage = await message.save();

      // Assert
      expect(savedMessage.status).toBe(Message_Status.Seen);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      // Arrange
      const chat = await new chatModel(chatFactory.create()).save();
      const messageData = messageFactory.create({
        chat: chat.id,
        sender: chat.members[0].toString(),
      });

      // Act
      const message = new messageModel(messageData);
      const savedMessage = await message.save();

      // Assert
      expect(savedMessage.createdAt).toBeDefined();
      expect(savedMessage.updatedAt).toBeDefined();
      expect(savedMessage.createdAt).toBeInstanceOf(Date);
      expect(savedMessage.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt when document is modified', async () => {
      // Arrange
      const chat = await new chatModel(chatFactory.create()).save();
      const messageData = messageFactory.create({
        chat: chat.id,
        sender: chat.members[0].toString(),
      });

      const message = new messageModel(messageData);
      const savedMessage = await message.save();
      const originalUpdatedAt = savedMessage.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Act
      savedMessage.status = Message_Status.Seen;
      const updatedMessage = await savedMessage.save();

      // Assert
      expect(updatedMessage.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Virtual Properties', () => {
    test('should include virtuals in JSON output', async () => {
      // Arrange
      const chat = await new chatModel(chatFactory.create()).save();
      const messageData = messageFactory.create({
        chat: chat.id,
        sender: chat.members[0].toString(),
      });

      // Act
      const message = new messageModel(messageData);
      const savedMessage = await message.save();
      const messageJSON = savedMessage.toJSON();

      // Assert
      expect(messageJSON).toHaveProperty('id');
      expect(messageJSON).toHaveProperty('chat');
      expect(messageJSON).toHaveProperty('sender');
      expect(messageJSON).toHaveProperty('status');
      expect(messageJSON).toHaveProperty('content');
      expect(messageJSON).toHaveProperty('createdAt');
      expect(messageJSON).toHaveProperty('updatedAt');
    });

    test('should include virtuals in Object output', async () => {
      // Arrange
      const chat = await new chatModel(chatFactory.create()).save();
      const messageData = messageFactory.create({
        chat: chat.id,
        sender: chat.members[0].toString(),
      });

      // Act
      const message = new messageModel(messageData);
      const savedMessage = await message.save();
      const messageObject = savedMessage.toObject();

      // Assert
      expect(messageObject).toHaveProperty('id');
      expect(messageObject).toHaveProperty('chat');
      expect(messageObject).toHaveProperty('sender');
      expect(messageObject).toHaveProperty('status');
      expect(messageObject).toHaveProperty('content');
      expect(messageObject).toHaveProperty('createdAt');
      expect(messageObject).toHaveProperty('updatedAt');
    });
  });
});
