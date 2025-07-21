import { Server, Socket } from 'socket.io';
import * as notificationSchemas from '../../schemas/notificationSchemas';
import * as notificationService from '../../services/notificationService';
import { SocketEvents } from '../../enums/socketEventEnums';

export const sendNotification =
  (io: Server, socket?: Socket) =>
  async (notificationData: notificationSchemas.SendNotificationRequest) => {
    try {
      const mappedNotificationData = notificationSchemas.mapSendRequest(notificationData);

      const notification = notificationSchemas.mapSendResponse(
        await notificationService.send(mappedNotificationData)
      );

      io.to(`user:${notification.recipient.toString()}`).emit(
        SocketEvents.Notification,
        notification
      );
    } catch (err) {
      console.error('Kafka notification processing error:', err);
    }
  };
