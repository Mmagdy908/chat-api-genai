import { Server, Socket } from 'socket.io';
import * as notificationSchemas from '../../schemas/notificationSchemas';
import * as notificationService from '../../services/notificationService';
import { SocketEvents } from '../../enums/socketEventEnums';
import { handleSocketResponse } from '../../socket/socketUtils';
import { handleError } from '../../util/appError';

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

export const markNotificationsAsRead =
  (io: Server, socket: Socket) => async (_: any, callback: (response: any) => void) => {
    try {
      await notificationService.markNotificationsAsRead(socket.request.user.id);
      const response = {
        status: 'success',
        statusCode: 200,
        message: 'Successfully marked notifications as read',
      };

      handleSocketResponse(callback, response);
    } catch (err) {
      console.log('error marking notifications as read: ', err);
      handleSocketResponse(callback, handleError(err));
    }
  };
