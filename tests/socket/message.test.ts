import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { Server, Socket } from 'socket.io';
import { handleMessageEvents } from '../../src/socket/handlers/message';
import { SocketEvents } from '../../src/enums/socketEventEnums';

// Mock dependencies
jest.mock('../../src/services/messageService');
jest.mock('../../src/schemas/messageSchemas');
jest.mock('../../src/socket/socketUtils');
jest.mock('../../src/util/appError');

describe('Unit Tests - handleMessageEvents', () => {
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

  test('should register Message event listener', () => {
    // Act
    handleMessageEvents(io as Server, socket as Socket);

    // Assert
    expect(socket.on).toHaveBeenCalledWith(SocketEvents.Message, expect.any(Function));
  });
});
