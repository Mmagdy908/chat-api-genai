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
import * as notificationSocketController from '../../../src/controllers/socket/notificationSocketController';
import * as notificationService from '../../../src/services/notificationService';
import * as notificationSchemas from '../../../src/schemas/notificationSchemas';
import { SocketEvents } from '../../../src/enums/socketEventEnums';
import { notificationProducer } from '../../../src/kafka/producer';
import { setupConsumer } from '../../../src/kafka/consumer';
import { User } from '../../../src/interfaces/models/user';
import { Types } from 'mongoose';
import { Notification_Type } from '../../../src/enums/notificationEnums';
import { handleSocketResponse } from '../../../src/socket/socketUtils';
import { handleError } from '../../../src/util/appError';
import { handleNotificationEvents } from '../../../src/socket/handlers/notification';

// Mock dependencies
jest.mock('../../../src/services/notificationService');
jest.mock('../../../src/schemas/notificationSchemas');
jest.mock('../../../src/kafka/producer');
jest.mock('../../../src/kafka/consumer');
jest.mock('../../../src/socket/socketUtils');
jest.mock('../../../src/util/appError');

describe('Integration Tests - Notification Handling', () => {
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
    io.on(SocketEvents.Connection, (socket) => {
      serverSocket = socket;
      handleNotificationEvents(io, socket);
    });
  });

  afterAll((done) => {
    io.close();
    server.close(() => done());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    io.use((socket, next) => {
      socket.request.user = { id: 'user123' } as User;
      next();
    });
  });

  afterEach((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    done();
  });

  test('should handle friend request sent notification via Kafka', (done) => {
    // Arrange
    const notificationData = {
      recipient: '687df740281a61ee825c3a8b',
      type: Notification_Type.Received_Friend_Request,
    };
    const mappedNotificationData = { ...notificationData };
    const mockNotification = {
      id: 'notif123',
      recipient: new Types.ObjectId('687df740281a61ee825c3a8b'),
      type: Notification_Type.Received_Friend_Request,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    jest
      .mocked(notificationSchemas.mapSendRequest)
      .mockReturnValue(mappedNotificationData as notificationSchemas.SendNotificationRequest);
    jest
      .mocked(notificationService.send)
      .mockResolvedValue(mockNotification as notificationSchemas.SendNotificationResponse);
    jest
      .mocked(notificationSchemas.mapSendResponse)
      .mockReturnValue(mockNotification as notificationSchemas.SendNotificationResponse);
    jest.mocked(notificationProducer).mockResolvedValue(undefined);
    jest.mocked(setupConsumer).mockImplementation(() => async () => {
      await notificationSocketController.sendNotification(io)(
        notificationData as notificationSchemas.SendNotificationRequest
      );
    });
    jest.spyOn(io, 'to').mockReturnThis();
    jest.spyOn(io, 'emit');

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);
    clientSocket.on('connect', async () => {
      await serverSocket.join(`user:${notificationData.recipient}`);
      clientSocket.on(SocketEvents.Notification, (notification: any) => {
        const expectedNotification = {
          ...mockNotification,
          recipient: mockNotification.recipient.toString(),
          createdAt: mockNotification.createdAt.toISOString(),
          updatedAt: mockNotification.updatedAt.toISOString(),
        };
        expect(notification).toEqual(expectedNotification);
        expect(notificationSchemas.mapSendRequest).toHaveBeenCalledWith(
          notificationData as notificationSchemas.SendNotificationRequest
        );
        expect(notificationService.send).toHaveBeenCalledWith(
          mappedNotificationData as notificationSchemas.SendNotificationRequest
        );
        expect(notificationSchemas.mapSendResponse).toHaveBeenCalledWith(
          mockNotification as notificationSchemas.SendNotificationResponse
        );
        expect(io.to).toHaveBeenCalledWith(`user:${notificationData.recipient}`);
        expect(io.emit).toHaveBeenCalledWith(SocketEvents.Notification, mockNotification);
        expect(serverSocket.rooms.has(`user:${notificationData.recipient}`)).toBe(true);
        done();
      });

      // Act: Simulate producing and consuming a notification
      await notificationProducer(notificationData as notificationSchemas.SendNotificationRequest);
      await setupConsumer(io)();
    });
  });

  test('should handle friend request accepted notification via Kafka', (done) => {
    // Arrange
    const notificationData = {
      recipient: '687df740281a61ee825c3a8b',
      type: Notification_Type.Accepted_Friend_Request,
    };
    const mappedNotificationData = { ...notificationData };
    const mockNotification = {
      id: 'notif124',
      recipient: new Types.ObjectId('687df740281a61ee825c3a8b'),
      type: Notification_Type.Accepted_Friend_Request,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    jest
      .mocked(notificationSchemas.mapSendRequest)
      .mockReturnValue(mappedNotificationData as notificationSchemas.SendNotificationRequest);
    jest
      .mocked(notificationService.send)
      .mockResolvedValue(mockNotification as notificationSchemas.SendNotificationResponse);
    jest
      .mocked(notificationSchemas.mapSendResponse)
      .mockReturnValue(mockNotification as notificationSchemas.SendNotificationResponse);
    jest.mocked(notificationProducer).mockResolvedValue(undefined);
    jest.mocked(setupConsumer).mockImplementation(() => async () => {
      await notificationSocketController.sendNotification(io)(
        notificationData as notificationSchemas.SendNotificationRequest
      );
    });
    jest.spyOn(io, 'to').mockReturnThis();
    jest.spyOn(io, 'emit');

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);
    clientSocket.on('connect', async () => {
      await serverSocket.join(`user:${notificationData.recipient}`);
      clientSocket.on(SocketEvents.Notification, (notification: any) => {
        const expectedNotification = {
          ...mockNotification,
          recipient: mockNotification.recipient.toString(),
          createdAt: mockNotification.createdAt.toISOString(),
          updatedAt: mockNotification.updatedAt.toISOString(),
        };
        expect(notification).toEqual(expectedNotification);
        expect(notificationSchemas.mapSendRequest).toHaveBeenCalledWith(
          notificationData as notificationSchemas.SendNotificationRequest
        );
        expect(notificationService.send).toHaveBeenCalledWith(
          mappedNotificationData as notificationSchemas.SendNotificationRequest
        );
        expect(notificationSchemas.mapSendResponse).toHaveBeenCalledWith(
          mockNotification as notificationSchemas.SendNotificationResponse
        );
        expect(io.to).toHaveBeenCalledWith(`user:${notificationData.recipient}`);
        expect(io.emit).toHaveBeenCalledWith(SocketEvents.Notification, mockNotification);
        expect(serverSocket.rooms.has(`user:${notificationData.recipient}`)).toBe(true);
        done();
      });

      // Act: Simulate producing and consuming a notification
      await notificationProducer(notificationData as notificationSchemas.SendNotificationRequest);
      await setupConsumer(io)();
    });
  });

  test('should handle error in notification processing', (done) => {
    // Arrange
    const notificationData = {
      recipient: '687df740281a61ee825c3a8b',
      type: Notification_Type.Received_Friend_Request,
    };
    const error = new Error('Missing Sender');
    jest.mocked(notificationSchemas.mapSendRequest).mockImplementation(() => {
      throw error;
    });
    jest.mocked(notificationProducer).mockResolvedValue(undefined);
    jest.mocked(setupConsumer).mockImplementation(() => async () => {
      await notificationSocketController.sendNotification(io)(
        notificationData as notificationSchemas.SendNotificationRequest
      );
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(io, 'to').mockReturnThis();
    jest.spyOn(io, 'emit');

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);
    clientSocket.on('connect', async () => {
      await serverSocket.join(`user:${notificationData.recipient}`);
      clientSocket.on(SocketEvents.Notification, () => {
        throw new Error('Should not receive notification on error');
      });

      // Act
      await notificationProducer(notificationData as notificationSchemas.SendNotificationRequest);
      await setupConsumer(io)();

      // Assert
      expect(notificationSchemas.mapSendRequest).toHaveBeenCalledWith(
        notificationData as notificationSchemas.SendNotificationRequest
      );
      expect(notificationService.send).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Kafka notification processing error:', error);
      expect(io.to).not.toHaveBeenCalled();
      expect(io.emit).not.toHaveBeenCalled();
      done();
    });
  });

  test('should handle Mark_Notifications_As_Read event successfully', (done) => {
    // Arrange
    jest.mocked(notificationService.markNotificationsAsRead).mockResolvedValue(undefined);
    jest.mocked(handleSocketResponse).mockImplementation((cb, response) => cb(response));

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Act
      clientSocket.emit(SocketEvents.Mark_Notifications_As_Read, null, (response: any) => {
        // Assert
        expect(notificationService.markNotificationsAsRead).toHaveBeenCalledWith('user123');
        expect(handleSocketResponse).toHaveBeenCalledWith(expect.any(Function), {
          status: 'success',
          statusCode: 200,
          message: 'Successfully marked notifications as read',
        });
        expect(response).toEqual({
          status: 'success',
          statusCode: 200,
          message: 'Successfully marked notifications as read',
        });
        done();
      });
    });
  });

  test('should handle error in Mark_Notifications_As_Read event', (done) => {
    // Arrange
    const error = new Error('Database error');
    const mockErrorResponse = { status: 'error', statusCode: 500, message: 'Database error' };
    jest.mocked(notificationService.markNotificationsAsRead).mockRejectedValue(error);
    jest.mocked(handleError).mockReturnValue(mockErrorResponse);
    jest.mocked(handleSocketResponse).mockImplementation((cb, response) => cb(response));

    // Connect client
    clientSocket = ioClient(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      // Act
      clientSocket.emit(SocketEvents.Mark_Notifications_As_Read, null, (response: any) => {
        // Assert
        expect(notificationService.markNotificationsAsRead).toHaveBeenCalledWith('user123');
        expect(handleError).toHaveBeenCalledWith(error);
        expect(handleSocketResponse).toHaveBeenCalledWith(expect.any(Function), mockErrorResponse);
        expect(response).toEqual(mockErrorResponse);
        done();
      });
    });
  });
});
