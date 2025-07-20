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
import { messageProducer } from '../../../src/kafka/producer';
import * as messageSocketController from '../../../src/controllers/socket/messageSocketController';
import { messageConsumer } from '../../../src/kafka/consumer';

// Mock dependencies
jest.mock('../../../src/services/messageService');
jest.mock('../../../src/schemas/messageSchemas');
jest.mock('../../../src/socket/socketUtils');
jest.mock('../../../src/util/appError');
jest.mock('../../../src/kafka/producer');
jest.mock('../../../src/kafka/consumer');

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

  test('should handle Message event successfully with text content via Kafka', (done) => {
    // Arrange
    const messageData = messageFactory.create();
    const mappedMessageData = {
      ...messageData,
      sender: 'user123',
    } as messageSchemas.SendMessageRequest;
    jest.mocked(messageSchemas.mapSendRequest).mockReturnValue(mappedMessageData);
    jest.mocked(messageProducer).mockResolvedValue(undefined);
    jest.mocked(handleSocketResponse).mockImplementation((cb, response) => cb(response));

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Act
      clientSocket.emit(SocketEvents.Message, messageData, (response: any) => {
        // Assert
        expect(messageSchemas.mapSendRequest).toHaveBeenCalledWith(mappedMessageData);
        expect(messageProducer).toHaveBeenCalledWith(mappedMessageData);
        expect(messageService.send).not.toHaveBeenCalled(); // Not called since using Kafka
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

  test('should handle Message event successfully with media content via Kafka', (done) => {
    // Arrange
    const messageData = messageFactory.create({
      content: { contentType: Message_Type.Image, mediaUrl: 'http://example.com/image.jpg' },
    }) as messageSchemas.SendMessageRequest;
    const mappedMessageData = { ...messageData, sender: 'user123' };
    jest.mocked(messageSchemas.mapSendRequest).mockReturnValue(mappedMessageData);
    jest.mocked(messageProducer).mockResolvedValue(undefined);
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
        expect(messageProducer).toHaveBeenCalledWith(mappedMessageData);
        expect(messageService.send).not.toHaveBeenCalled(); // Not called since using Kafka
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
    jest.mocked(messageProducer).mockResolvedValue(undefined);
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
        expect(messageProducer).not.toHaveBeenCalled();
        expect(messageService.send).not.toHaveBeenCalled();
        expect(handleError).toHaveBeenCalledWith(error);
        expect(handleSocketResponse).toHaveBeenCalledWith(expect.any(Function), mockErrorResponse);
        expect(response).toEqual(mockErrorResponse);
        done();
      });
    });
  });

  test('should handle error in Message event with invalid content', (done) => {
    // Arrange
    const messageData = messageFactory.create({
      content: { contentType: Message_Type.Text }, // Missing text
    }) as messageSchemas.SendMessageRequest;
    const error = new Error('Text content must have text');
    const mockErrorResponse = {
      status: 'error',
      statusCode: 400,
      message: 'Text content must have text',
    };
    jest.mocked(messageSchemas.mapSendRequest).mockImplementation(() => {
      throw error;
    });
    jest.mocked(messageProducer).mockResolvedValue(undefined);
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
        expect(messageProducer).not.toHaveBeenCalled();
        expect(messageService.send).not.toHaveBeenCalled();
        expect(handleError).toHaveBeenCalledWith(error);
        expect(handleSocketResponse).toHaveBeenCalledWith(expect.any(Function), mockErrorResponse);
        expect(response).toEqual(mockErrorResponse);
        done();
      });
    });
  });

  test('should handle Kafka consumer processing message and emitting to chat room', (done) => {
    // Arrange
    const messageData = messageFactory.create({
      content: { contentType: Message_Type.Text, text: 'Hello from Kafka!' },
      sender: 'user123',
    }) as messageSchemas.SendMessageRequest;
    const mappedMessageData = { ...messageData } as messageSchemas.SendMessageRequest;
    const mockMessage = {
      id: 'msg123',
      chat: new Types.ObjectId(mappedMessageData.chat),
      sender: {
        id: mappedMessageData.sender,
        firstName: 'John',
        lastName: 'Doe',
        photo: 'http://example.com/photo.jpg',
      },
      status: Message_Status.Sent,
      content: mappedMessageData.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockResponse = { ...mockMessage };
    jest.mocked(messageService.send).mockResolvedValue(mockMessage);
    jest.mocked(messageSchemas.mapSendResponse).mockReturnValue(mockResponse);
    jest.mocked(messageConsumer).mockImplementation(() => async () => {
      // Simulate consumer calling sendMessage
      await messageSocketController.sendMessage(io)(messageData);
    });
    jest.spyOn(io, 'to').mockReturnThis();
    jest.spyOn(io, 'emit');

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', async () => {
      // Join the chat room to receive messages
      await serverSocket.join(`chat:${messageData.chat}`);

      clientSocket.on(SocketEvents.Message, (message: any) => {
        // Assert
        const expectedMessage = {
          ...mockResponse,
          chat: mockResponse.chat.toString(),
          createdAt: mockResponse.createdAt.toISOString(),
          updatedAt: mockResponse.updatedAt.toISOString(),
        };
        expect(message).toEqual(expectedMessage);
        expect(messageService.send).toHaveBeenCalledWith(mappedMessageData);
        expect(messageSchemas.mapSendResponse).toHaveBeenCalledWith(mockMessage);
        expect(io.to).toHaveBeenCalledWith(`chat:${messageData.chat}`);
        expect(io.emit).toHaveBeenCalledWith(SocketEvents.Message, mockResponse);
        const socketRooms = Array.from(serverSocket.rooms);
        expect(socketRooms).toContain(`chat:${messageData.chat}`);
        done();
      });

      // Act: Simulate consumer processing a message
      await messageConsumer(io)();
    });
  });
  // test('should broadcast Message event to chat room', (done) => {
  //   // Arrange
  //   const messageData = messageFactory.create();
  //   const mappedMessageData = {
  //     ...messageData,
  //   } as messageSchemas.SendMessageRequest;
  //   const mockMessage: messageSchemas.SendMessageResponse = {
  //     id: 'msg123',
  //     chat: new Types.ObjectId(messageData.chat!),
  //     sender: {
  //       id: 'user123',
  //       firstName: 'John',
  //       lastName: 'Doe',
  //       photo: 'http://example.com/photo.jpg',
  //     },
  //     status: Message_Status.Sent,
  //     content: messageData.content!,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //   };
  //   const mockResponse = { ...mockMessage };
  //   jest.mocked(messageSchemas.mapSendRequest).mockReturnValue(mappedMessageData);
  //   jest.mocked(messageService.send).mockResolvedValue(mockMessage);
  //   jest.mocked(messageSchemas.mapSendResponse).mockReturnValue(mockResponse);
  //   jest.mocked(handleSocketResponse).mockImplementation((cb, response) => cb(response));

  //   // Connect client
  //   clientSocket = ioClient(`http://localhost:${port}`);

  //   clientSocket.on(SocketEvents.Message, (message: any) => {
  //     const responseMessage = {
  //       ...mockResponse,
  //       chat: mockResponse.chat.toString(),
  //       createdAt: mockResponse.createdAt.toISOString(),
  //       updatedAt: mockResponse.updatedAt.toISOString(),
  //     };
  //     // Assert
  //     expect(message).toEqual(responseMessage);
  //     // expect(io.to).toHaveBeenCalledWith(`chat:${messageData.chat}`);
  //     // expect(io.emit).toHaveBeenCalledWith(SocketEvents.Message, mockResponse);
  //     const socketRooms = Array.from(serverSocket.rooms);
  //     expect(socketRooms).toContain(`chat:${messageData.chat}`); // Verify serverSocket is in the room
  //     done();
  //   });

  //   clientSocket.on('connect', async () => {
  //     // Join the chat room to receive messages
  //     await serverSocket.join(`chat:${messageData.chat}`);

  //     clientSocket.emit(SocketEvents.Message, messageData, () => {});
  //   });
  // });
});
