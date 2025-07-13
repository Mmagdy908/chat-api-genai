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
import * as chatHandler from '../../src/socket/handlers/chat';
import * as chatService from '../../src/services/chatService';
import { handleSocketResponse } from '../../src/socket/socketUtils';
import { SocketEvents } from '../../src/enums/socketEventEnums';
import { handleError } from '../../src/util/appError';
import { User } from '../../src/interfaces/models/user';
import { Chat } from '../../src/interfaces/models/chat';

// Mock dependencies
jest.mock('../../src/services/chatService');
jest.mock('../../src/socket/socketUtils');
jest.mock('../../src/util/appError');

describe('Integration Tests - chatHandler.handleChatEvents', () => {
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

    io.on('connection', (socket) => {
      serverSocket = socket;
    });
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test('should handle Chat_Join event successfully', (done) => {
    // Arrange
    const chatId = 'chat456';
    jest.mocked(chatService.join).mockResolvedValue(undefined);
    jest.mocked(handleSocketResponse).mockImplementation((cb, response) => cb(response));

    // Setup socket events
    io.on(SocketEvents.Connection, (socket) => {
      chatHandler.handleChatEvents(io, socket);
    });

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Act
      clientSocket.emit(SocketEvents.Chat_Join, chatId, (response: any) => {
        // Assert
        expect(chatService.join).toHaveBeenCalledWith('user123', chatId);
        expect(handleSocketResponse).toHaveBeenCalledWith(expect.any(Function), {
          status: 'success',
          statusCode: 200,
          message: 'Successfully joined chat',
        });
        expect(response).toEqual({
          status: 'success',
          statusCode: 200,
          message: 'Successfully joined chat',
        });
        done();
      });
    });
  });

  test('should handle error in Chat_Join event', (done) => {
    // Arrange
    const chatId = 'invalidChat';
    const error = new Error('Invalid chat ID');
    const mockErrorResponse = { status: 'error', statusCode: 400, message: 'Invalid chat ID' };
    jest.mocked(chatService.join).mockRejectedValue(error);
    jest.spyOn(chatHandler, 'joinUserChats');
    jest.mocked(handleError).mockReturnValue(mockErrorResponse);
    jest.mocked(handleSocketResponse).mockImplementation((cb, response) => cb(response));

    // Setup socket events
    io.on(SocketEvents.Connection, (socket) => {
      chatHandler.handleChatEvents(io, socket);
    });

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Act
      clientSocket.emit(SocketEvents.Chat_Join, chatId, (response: any) => {
        // Assert
        expect(chatService.join).toHaveBeenCalledWith('user123', chatId);
        expect(handleError).toHaveBeenCalledWith(error);
        expect(handleSocketResponse).toHaveBeenCalledWith(expect.any(Function), mockErrorResponse);
        expect(response).toEqual(mockErrorResponse);

        // Verify socket didn't join the room
        const socketRooms = Array.from(serverSocket.rooms);
        expect(socketRooms).not.toContain(`chat:${chatId}`);
        done();
      });
    });
  });

  test('should join user chats on connection', (done) => {
    // Arrange
    const mockChats = [{ id: 'chat1' }, { id: 'chat2' }] as Chat[];
    jest.mocked(chatService.getAllChatsByMember).mockResolvedValue(mockChats);
    jest.mocked(chatService.join);

    // Mock joinUserChats to spy on socket.join
    jest.spyOn(chatHandler, 'joinUserChats');

    // Setup socket events
    io.on(SocketEvents.Connection, (socket) => {
      chatHandler.handleChatEvents(io, socket);
    });

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Wait briefly to ensure joinUserChats is called
      setTimeout(() => {
        // Assert
        expect(chatService.getAllChatsByMember).toHaveBeenCalledWith('user123');
        expect(chatHandler.joinUserChats).toHaveBeenCalled();

        // Verify sockets joined the room
        const socketRooms = Array.from(serverSocket.rooms);
        expect(socketRooms).toContain(`chat:${mockChats[0].id}`);
        expect(socketRooms).toContain(`chat:${mockChats[1].id}`);
        done();
      }, 100);
    });
  });
});
