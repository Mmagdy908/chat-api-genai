import {
  jest,
  describe,
  expect,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import ioClient from 'socket.io-client';
import { handleMessageEvents } from '../../../src/socket/handlers/message';
import * as messageService from '../../../src/services/messageService';
import * as messageSchemas from '../../../src/schemas/messageSchemas';
import { SocketEvents } from '../../../src/enums/socketEventEnums';
import { handleSocketResponse } from '../../../src/socket/socketUtils';
import { handleError } from '../../../src/util/appError';
import { User } from '../../../src/interfaces/models/user';
import { messageFactory } from '../../utils/messageFactory';
import { Message_Status, Message_Type } from '../../../src/enums/messageEnums';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../src/services/messageService');
jest.mock('../../../src/schemas/messageSchemas');
jest.mock('../../../src/socket/socketUtils');
jest.mock('../../../src/util/appError');

describe('Integration Tests - handleMessageEvents', () => {
  let io: Server;
  let server: ReturnType<typeof createServer>;
  let serverSocket: Socket;
  let clientSocket: ReturnType<typeof ioClient>;
  let port: number;

  beforeAll((done) => {
    server = createServer();
    io = new Server(server, { cors: { origin: '*' } });
    server.listen(() => {
      port = (server.address() as AddressInfo).port;
      done();
    });
    // Setup socket events
    io.on(SocketEvents.Connection, (socket) => {
      serverSocket = socket;

      handleMessageEvents(io, socket);
    });
  });

  afterAll((done) => {
    io.close();
    server.close(() => done());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock middleware to bypass authentication
    io.use((socket, next) => {
      socket.request.user = { id: 'user123' } as User;
      next();
    });
  });

  afterEach(() => {
    clientSocket.disconnect();
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test('should handle Message event successfully with text content', (done) => {
    // Arrange
    const messageData = {
      chat: '685c46356a5d7ff0af63af79',
      content: { contentType: Message_Type.Text, text: 'Hello, world!' },
    };
    const mappedMessageData = { ...messageData, sender: 'user123' };
    const mockMessage: messageSchemas.SendMessageResponse = {
      id: 'msg123',
      chat: new Types.ObjectId('685c46356a5d7ff0af63af79'),
      sender: {
        id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        photo: 'http://example.com/photo.jpg',
      },
      status: Message_Status.Sent,
      content: { contentType: Message_Type.Text, text: 'Hello, world!' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockResponse = { ...mockMessage };
    jest.mocked(messageSchemas.mapSendRequest).mockReturnValue(mappedMessageData);
    jest.mocked(messageService.send).mockResolvedValue(mockMessage);
    jest.mocked(messageSchemas.mapSendResponse).mockReturnValue(mockResponse);
    jest.mocked(handleSocketResponse).mockImplementation((cb, response) => cb(response));

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Act
      clientSocket.emit(SocketEvents.Message, messageData, (response: any) => {
        // Assert
        expect(messageSchemas.mapSendRequest).toHaveBeenCalledWith({
          ...messageData,
          sender: 'user123',
        });
        expect(messageService.send).toHaveBeenCalledWith(mappedMessageData);
        expect(messageSchemas.mapSendResponse).toHaveBeenCalledWith(mockMessage);
        // expect(io.to).toHaveBeenCalledWith('chat:685c46356a5d7ff0af63af79');
        // expect(io.emit).toHaveBeenCalledWith(SocketEvents.Message, mockResponse);
        expect(handleSocketResponse).toHaveBeenCalledWith(expect.any(Function), {
          status: 'success',
          statusCode: 200,
          message: 'Successfully sent message',
        });
        expect(response).toEqual({
          status: 'success',
          statusCode: 200,
          message: 'Successfully sent message',
        });
        done();
      });
    });
  });

  test('should handle Message event successfully with media content', (done) => {
    // Arrange
    const messageData = {
      chat: '685c46356a5d7ff0af63af79',
      content: { contentType: Message_Type.Image, mediaUrl: 'http://example.com/image.jpg' },
    };
    const mappedMessageData = { ...messageData, sender: 'user123' };
    const mockMessage = messageFactory.create({
      content: { contentType: Message_Type.Image, mediaUrl: 'http://example.com/image.jpg' },
      sender: 'user123',
      chat: '685c46356a5d7ff0af63af79',
    });
    const mockResponse: messageSchemas.SendMessageResponse = {
      id: mockMessage.chat!,
      chat: new Types.ObjectId(mockMessage.chat),
      sender: {
        id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        photo: 'http://example.com/photo.jpg',
      },
      status: Message_Status.Sent,
      content: { contentType: Message_Type.Image, mediaUrl: 'http://example.com/image.jpg' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    jest.mocked(messageSchemas.mapSendRequest).mockReturnValue(mappedMessageData);
    jest.mocked(messageService.send).mockResolvedValue(mockResponse);
    jest.mocked(messageSchemas.mapSendResponse).mockReturnValue(mockResponse);
    jest.mocked(handleSocketResponse).mockImplementation((cb, response) => cb(response));

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Act
      clientSocket.emit(SocketEvents.Message, messageData, (response: any) => {
        // Assert
        expect(messageSchemas.mapSendRequest).toHaveBeenCalledWith({
          ...messageData,
          sender: 'user123',
        });
        expect(messageService.send).toHaveBeenCalledWith(mappedMessageData);
        expect(messageSchemas.mapSendResponse).toHaveBeenCalledWith(mockResponse);
        // expect(io.to).toHaveBeenCalledWith('chat:685c46356a5d7ff0af63af79');
        // expect(io.emit).toHaveBeenCalledWith(SocketEvents.Message, mockResponse);
        expect(handleSocketResponse).toHaveBeenCalledWith(expect.any(Function), {
          status: 'success',
          statusCode: 200,
          message: 'Successfully sent message',
        });
        expect(response).toEqual({
          status: 'success',
          statusCode: 200,
          message: 'Successfully sent message',
        });
        done();
      });
    });
  });

  test('should handle error in Message event with invalid chat ID', (done) => {
    // Arrange
    const messageData = messageFactory.createWithMissingFields('chat');
    const error = new Error('Invalid chat ID');
    const mockErrorResponse = { status: 'error', statusCode: 400, message: 'Invalid chat ID' };
    jest.mocked(messageSchemas.mapSendRequest).mockImplementation(() => {
      throw error;
    });
    jest.mocked(handleError).mockReturnValue(mockErrorResponse);
    jest.mocked(handleSocketResponse).mockImplementation((cb, response) => cb(response));

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Act
      clientSocket.emit(SocketEvents.Message, messageData, (response: any) => {
        // Assert
        expect(messageSchemas.mapSendRequest).toHaveBeenCalledWith({
          ...messageData,
          sender: 'user123',
        } as messageSchemas.SendMessageRequest);
        expect(messageService.send).not.toHaveBeenCalled();
        expect(handleError).toHaveBeenCalledWith(error);
        expect(handleSocketResponse).toHaveBeenCalledWith(expect.any(Function), mockErrorResponse);
        expect(response).toEqual(mockErrorResponse);
        // expect(io.to).not.toHaveBeenCalled(); // No broadcast on error
        done();
      });
    });
  });

  test('should handle error in Message event with invalid content', (done) => {
    // Arrange
    const messageData = {
      chat: '685c46356a5d7ff0af63af79',
      content: { contentType: Message_Type.Text }, // Missing text
    };
    const error = new Error('Text content must have text');
    const mockErrorResponse = {
      status: 'error',
      statusCode: 400,
      message: 'Text content must have text',
    };
    jest.mocked(messageSchemas.mapSendRequest).mockImplementation(() => {
      throw error;
    });
    jest.mocked(handleError).mockReturnValue(mockErrorResponse);
    jest.mocked(handleSocketResponse).mockImplementation((cb, response) => cb(response));

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Act
      clientSocket.emit(SocketEvents.Message, messageData, (response: any) => {
        // Assert
        expect(messageSchemas.mapSendRequest).toHaveBeenCalledWith({
          ...messageData,
          sender: 'user123',
        });
        expect(messageService.send).not.toHaveBeenCalled();
        expect(handleError).toHaveBeenCalledWith(error);
        expect(handleSocketResponse).toHaveBeenCalledWith(expect.any(Function), mockErrorResponse);
        expect(response).toEqual(mockErrorResponse);
        // expect(io.to).not.toHaveBeenCalled(); // No broadcast on error
        done();
      });
    });
  });

  test('should broadcast Message event to chat room', (done) => {
    // Arrange
    const messageData = messageFactory.create();
    const mappedMessageData = {
      ...messageData,
    } as messageSchemas.SendMessageRequest;
    const mockMessage: messageSchemas.SendMessageResponse = {
      id: 'msg123',
      chat: new Types.ObjectId(messageData.chat!),
      sender: {
        id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        photo: 'http://example.com/photo.jpg',
      },
      status: Message_Status.Sent,
      content: messageData.content!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockResponse = { ...mockMessage };
    jest.mocked(messageSchemas.mapSendRequest).mockReturnValue(mappedMessageData);
    jest.mocked(messageService.send).mockResolvedValue(mockMessage);
    jest.mocked(messageSchemas.mapSendResponse).mockReturnValue(mockResponse);
    jest.mocked(handleSocketResponse).mockImplementation((cb, response) => cb(response));

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on(SocketEvents.Message, (message: any) => {
      const responseMessage = {
        ...mockResponse,
        chat: mockResponse.chat.toString(),
        createdAt: mockResponse.createdAt.toISOString(),
        updatedAt: mockResponse.updatedAt.toISOString(),
      };
      // Assert
      expect(message).toEqual(responseMessage);
      // expect(io.to).toHaveBeenCalledWith(`chat:${messageData.chat}`);
      // expect(io.emit).toHaveBeenCalledWith(SocketEvents.Message, mockResponse);
      const socketRooms = Array.from(serverSocket.rooms);
      expect(socketRooms).toContain(`chat:${messageData.chat}`); // Verify serverSocket is in the room
      done();
    });

    clientSocket.on('connect', async () => {
      // Join the chat room to receive messages
      await serverSocket.join(`chat:${messageData.chat}`);

      clientSocket.emit(SocketEvents.Message, messageData, () => {});
    });
  });
});
