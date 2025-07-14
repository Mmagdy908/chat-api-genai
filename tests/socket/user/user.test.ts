import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { Server, Socket } from 'socket.io';
import { handleUserEvents } from '../../../src/socket/handlers/user';
import * as userController from '../../../src/controllers/userController';
import { SocketEvents } from '../../../src/enums/socketEventEnums';

// Mock dependencies
jest.mock('../../../src/controllers/userController');

describe('Unit Tests - handleUserEvents', () => {
  let socket: any;
  let io: any;

  beforeEach(() => {
    socket = {
      on: jest.fn(),
      request: { user: { id: 'user123' } },
    };
    io = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('should register connect, Heartbeat, and Disconnect events', async () => {
    // Arrange
    const mockConnect = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const mockHeartbeat = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const mockDisconnect = jest.fn();
    jest.mocked(userController.connect).mockReturnValue(mockConnect);
    jest.mocked(userController.heartbeat).mockReturnValue(mockHeartbeat);
    jest.mocked(userController.disconnect).mockReturnValue(mockDisconnect);

    // Act
    await handleUserEvents(io as Server, socket as Socket);

    // Assert
    expect(userController.connect).toHaveBeenCalledWith(io, socket);
    expect(mockConnect).toHaveBeenCalled();
    expect(socket.on).toHaveBeenCalledWith(SocketEvents.Heartbeat, mockHeartbeat);
    expect(socket.on).toHaveBeenCalledWith(SocketEvents.Disconnect, mockDisconnect);
  });

  test('should handle errors gracefully', async () => {
    // Arrange
    const error = new Error('Connect error');
    jest.mocked(userController.connect).mockImplementation(() => {
      throw error;
    });

    // Act
    await handleUserEvents(io as Server, socket as Socket);

    // Assert
    expect(userController.connect).toHaveBeenCalledWith(io, socket);
    expect(socket.on).not.toHaveBeenCalled(); // No further events registered on error
  });
});
