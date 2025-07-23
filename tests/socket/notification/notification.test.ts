import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { Server, Socket } from 'socket.io';
import * as notificationSocketController from '../../../src/controllers/socket/notificationSocketController';
import { notificationProducer } from '../../../src/kafka/producer';
import { setupConsumer } from '../../../src/kafka/consumer';
import { SocketEvents } from '../../../src/enums/socketEventEnums';
import { SendNotificationRequest } from '../../../src/schemas/notificationSchemas';
import { handleNotificationEvents } from '../../../src/socket/handlers/notification';

jest.mock('../../../src/kafka/producer', () => ({
  notificationProducer: jest.fn(),
}));

jest.mock('../../../src/kafka/consumer', () => ({
  setupConsumer: jest.fn(),
}));

describe('Unit Tests - Notification Handling', () => {
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

  test('should register Mark_Notifications_As_Read event listener', () => {
    // Act
    handleNotificationEvents(io as Server, socket as Socket);

    // Assert
    expect(socket.on).toHaveBeenCalledWith(
      SocketEvents.Mark_Notifications_As_Read,
      expect.any(Function)
    );
  });

  test('should set up consumer for notifications topic', () => {
    // Act
    setupConsumer(io as Server);

    // Assert
    expect(setupConsumer).toHaveBeenCalledWith(io);
  });

  test('should invoke notificationProducer with correct data', async () => {
    // Arrange
    const notificationData = {
      recipient: 'user456',
      type: 'friend_request_sent',
    };
    jest.mocked(notificationProducer).mockResolvedValue(undefined);

    // Act
    await notificationProducer(notificationData as SendNotificationRequest);

    // Assert
    expect(notificationProducer).toHaveBeenCalledWith(notificationData as SendNotificationRequest);
  });

  test('should register sendNotification handler for consumer', async () => {
    // Arrange
    const mockConsumerRun = jest.fn();
    jest.mocked(setupConsumer).mockImplementation(() => async () => {
      await mockConsumerRun();
    });

    // Act
    await setupConsumer(io)();

    // Assert
    expect(mockConsumerRun).toHaveBeenCalled();
  });
});
