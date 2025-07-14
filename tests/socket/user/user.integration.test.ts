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
import { handleUserEvents } from '../../../src/socket/handlers/user';
import * as userStatusService from '../../../src/services/userStatusService';
import * as chatService from '../../../src/services/chatService';
import * as userService from '../../../src/services/userService';
import { SocketEvents } from '../../../src/enums/socketEventEnums';
import { User_Status } from '../../../src/enums/userEnums';
import { User } from '../../../src/interfaces/models/user';
import ENV_VAR from '../../../src/config/envConfig';
import { Chat } from '../../../src/interfaces/models/chat';
import * as userController from '../../../src/controllers/userController';

// Mock dependencies
jest.mock('../../../src/services/userStatusService');
jest.mock('../../../src/services/chatService');
jest.mock('../../../src/services/userService');

describe('Integration Tests - handleUserEvents', () => {
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

      handleUserEvents(io, socket);
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

  afterEach(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
      await new Promise((resolve) => setTimeout(resolve, ENV_VAR.SOCKET_GRACE_PERIOD * 1000));
    }
  });

  test('should handle connect event and broadcast status', (done) => {
    // Arrange
    const userId = 'user123';
    const mockChats = [{ id: 'chat1' }, { id: 'chat2' }] as Chat[];
    const mockFriends = ['friend1', 'friend2'];
    const mockStatus = { status: User_Status.Offline, lastActive: new Date() };
    const mockFriendsStatuses = [
      { status: User_Status.Online, lastActive: new Date() },
      { status: User_Status.Idle, lastActive: new Date() },
    ];
    jest.mocked(userStatusService.addOnlineSocket).mockResolvedValue(undefined);
    jest.mocked(userStatusService.getUserStatus).mockResolvedValue(mockStatus);
    jest.mocked(userStatusService.setUserStatus).mockResolvedValue(undefined);
    jest.mocked(chatService.getAllChatsByMember).mockResolvedValue(mockChats);
    jest.mocked(userService.getUserFriends).mockResolvedValue(mockFriends);
    jest
      .mocked(userStatusService.getUserStatus)
      .mockResolvedValueOnce(mockStatus)
      .mockResolvedValueOnce(mockFriendsStatuses[0])
      .mockResolvedValueOnce(mockFriendsStatuses[1]);
    jest.spyOn(io, 'to').mockReturnThis();
    jest.spyOn(io, 'emit');

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on(SocketEvents.Friends_Status, (friendsStatuses: any) => {
      // Assert friends status
      expect(friendsStatuses).toEqual([
        {
          userId: 'friend1',
          status: {
            ...mockFriendsStatuses[0],
            lastActive: mockFriendsStatuses[0].lastActive.toISOString(),
          },
        },
        {
          userId: 'friend2',
          status: {
            ...mockFriendsStatuses[1],
            lastActive: mockFriendsStatuses[1].lastActive.toISOString(),
          },
        },
      ]);
      done();
    });

    clientSocket.on('connect', () => {
      // Assert
      expect(userStatusService.addOnlineSocket).toHaveBeenCalledWith(userId, serverSocket.id);
      expect(userStatusService.setUserStatus).toHaveBeenCalledWith(userId, User_Status.Online);
      expect(chatService.getAllChatsByMember).toHaveBeenCalledWith(userId);
      expect(io.to).toHaveBeenCalledWith(['chat:chat1', 'chat:chat2']);
      expect(io.emit).toHaveBeenCalledWith(SocketEvents.User_Status_Update, {
        userId,
        status: User_Status.Online,
        lastActive: mockStatus.lastActive,
      });
    });
  });

  test('should handle Heartbeat event and update status', (done) => {
    // Arrange
    const userId = 'user123';
    const mockChats = [{ id: 'chat1' }] as Chat[];
    const mockStatus = { status: User_Status.Offline, lastActive: new Date() };
    jest.mocked(userStatusService.getUserStatus).mockResolvedValue(mockStatus);
    jest.mocked(userStatusService.setUserStatus).mockResolvedValue(undefined);
    jest.mocked(userStatusService.updateHeartbeatKey).mockResolvedValue(undefined);
    jest.mocked(chatService.getAllChatsByMember).mockResolvedValue(mockChats);
    jest.spyOn(io, 'to').mockReturnThis();
    jest.spyOn(io, 'emit');

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Act
      clientSocket.emit(SocketEvents.Heartbeat, () => {});

      setTimeout(() => {
        // Assert
        expect(userStatusService.setUserStatus).toHaveBeenCalledWith(userId, User_Status.Online);
        expect(userStatusService.updateHeartbeatKey).toHaveBeenCalledWith(
          userId,
          ENV_VAR.HEARTBEAT_KEY_EXPIRES_IN
        );
        expect(io.to).toHaveBeenCalledWith(['chat:chat1']);
        expect(io.emit).toHaveBeenCalledWith(SocketEvents.User_Status_Update, {
          userId,
          status: User_Status.Online,
          lastActive: mockStatus.lastActive,
        });
        done();
      }, 200);
    });
  });

  test('should handle Disconnect event and update status after grace period', (done) => {
    // Arrange
    const userId = 'user123';
    const mockChats = [{ id: 'chat1' }] as Chat[];
    const mockStatus = { status: User_Status.Online, lastActive: new Date() };
    jest.mocked(userStatusService.removeOnlineSocket).mockResolvedValue(undefined);
    jest.mocked(userStatusService.getOnlineSocketsCount).mockResolvedValue(0);
    jest.mocked(userStatusService.getUserStatus).mockResolvedValue(mockStatus);
    jest.mocked(userStatusService.setUserStatus).mockResolvedValue(undefined);
    jest.mocked(chatService.getAllChatsByMember).mockResolvedValue(mockChats);
    jest.spyOn(io, 'to').mockReturnThis();
    jest.spyOn(io, 'emit');

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', async () => {
      // Act
      clientSocket.disconnect();

      setTimeout(() => {
        // Assert
        expect(userStatusService.removeOnlineSocket).toHaveBeenCalledWith(userId, serverSocket.id);
        expect(userStatusService.getOnlineSocketsCount).toHaveBeenCalledWith(userId);
        expect(userStatusService.setUserStatus).toHaveBeenCalledWith(userId, User_Status.Offline);
        expect(io.to).toHaveBeenCalledWith(['chat:chat1']);
        expect(io.emit).toHaveBeenCalledWith(SocketEvents.User_Status_Update, {
          userId,
          status: User_Status.Offline,
          lastActive: mockStatus.lastActive,
        });
        done();
      }, (ENV_VAR.SOCKET_GRACE_PERIOD + 0.1) * 1000);
    });
  });

  test('should handle key expired event and update status to Idle', (done) => {
    // Arrange
    const userId = 'user456';
    const mockChats = [{ id: 'chat1' }] as Chat[];
    const mockStatus = { status: User_Status.Online, lastActive: new Date() };
    jest.mocked(userStatusService.getOnlineSocketsCount).mockResolvedValue(1);
    jest.mocked(userStatusService.getUserStatus).mockResolvedValue(mockStatus);
    jest.mocked(userStatusService.setUserStatus).mockResolvedValue(undefined);
    jest.mocked(chatService.getAllChatsByMember).mockResolvedValue(mockChats);
    jest.spyOn(io, 'to').mockReturnThis();
    jest.spyOn(io, 'emit');

    // Setup socket events
    io.on(SocketEvents.Connection, (socket) => {
      handleUserEvents(io, socket);
    });

    // Simulate key expiration
    userController.handleKeyExpiredEvent(io)(`heartbeat:${userId}`, '__keyevent@0__:expired');

    // Wait briefly to ensure async operations complete
    setTimeout(() => {
      // Assert
      expect(userStatusService.getOnlineSocketsCount).toHaveBeenCalledWith(userId);
      expect(userStatusService.setUserStatus).toHaveBeenCalledWith(userId, User_Status.Idle);
      expect(io.to).toHaveBeenCalledWith(['chat:chat1']);
      expect(io.emit).toHaveBeenCalledWith(SocketEvents.User_Status_Update, {
        userId,
        status: User_Status.Idle,
        lastActive: mockStatus.lastActive,
      });
      done();
    }, 100);
  });

  test('should not broadcast status if unchanged', (done) => {
    // Arrange
    const userId = 'user123';
    const mockChats = [{ id: 'chat1' }] as Chat[];
    const mockStatus = { status: User_Status.Online, lastActive: new Date() };
    jest.mocked(userStatusService.addOnlineSocket).mockResolvedValue(undefined);
    jest.mocked(userStatusService.getUserStatus).mockResolvedValue(mockStatus);
    jest.mocked(userStatusService.setUserStatus).mockResolvedValue(undefined);
    jest.mocked(chatService.getAllChatsByMember).mockResolvedValue(mockChats);
    jest.spyOn(io, 'to').mockReturnThis();
    jest.spyOn(io, 'emit');

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Assert
      expect(userStatusService.setUserStatus).toHaveBeenCalledWith(userId, User_Status.Online);
      expect(io.to).not.toHaveBeenCalled(); // No broadcast since status unchanged

      done();
    });
  });
});
