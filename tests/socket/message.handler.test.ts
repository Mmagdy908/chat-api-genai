import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { Socket } from 'socket.io';
import { joinUserChats } from '../../src/socket/handlers/chat';
import * as chatService from '../../src/services/chatService';
import { Chat } from '../../src/interfaces/models/chat';

// Mock dependencies
jest.mock('../../src/services/chatService');

describe('Unit Tests - joinUserChats', () => {
  let socket: any;

  beforeEach(() => {
    socket = {
      join: jest.fn(),
      request: { user: { id: 'user123' } },
    };
    jest.clearAllMocks();
  });

  test('should join user to their chat rooms', async () => {
    // Arrange
    const mockChats = [{ id: 'chat1' }, { id: 'chat2' }] as Chat[];
    jest.mocked(chatService.getAllChatsByMember).mockResolvedValue(mockChats);

    // Act
    await joinUserChats(socket as Socket, 'user123');

    // Assert
    expect(chatService.getAllChatsByMember).toHaveBeenCalledWith('user123');
    expect(socket.join).toHaveBeenCalledWith(['chat:chat1', 'chat:chat2']);
  });

  test('should handle errors gracefully', async () => {
    // Arrange
    const error = new Error('Database error');
    jest.mocked(chatService.getAllChatsByMember).mockRejectedValue(error);

    // Act
    await joinUserChats(socket as Socket, 'user123');

    // Assert
    expect(chatService.getAllChatsByMember).toHaveBeenCalledWith('user123');
    expect(socket.join).not.toHaveBeenCalled();
  });
});
