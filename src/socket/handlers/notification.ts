import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../enums/socketEventEnums';
import * as notificationSocketController from '../../controllers/socket/notificationSocketController';

export const handleNotificationEvents = (io: Server, socket: Socket) => {
  socket.on(
    SocketEvents.Mark_Notifications_As_Read,
    notificationSocketController.markNotificationsAsRead(io, socket)
  );
};
