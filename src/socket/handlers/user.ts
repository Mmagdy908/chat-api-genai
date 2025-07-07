import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../enums/socketEventEnums';
import * as userStatusService from '../../services/userStatusService';
import * as chatService from '../../services/chatService';
import { User_Status } from '../../enums/userEnums';
import ENV_VAR from '../../config/envConfig';
import { handleSocketResponse } from '../socketUtils';
import { handleError } from '../../util/appError';

const broadcastUserStatus = async (io: Server, userId: string, status: User_Status) => {
  const oldStatus = await userStatusService.getUserStatus(userId);

  if (oldStatus !== status) {
    const userChats = (await chatService.getAllChatsByMember(userId)).map(
      (chat) => `chat:${chat.id}`
    );

    await userStatusService.setUserStatus(userId, status);

    io.to(userChats).emit(SocketEvents.User_Status_Update, {
      userId,
      status,
    });
  }
};

export const handleUserEvents = async (io: Server, socket: Socket) => {
  try {
    await userStatusService.addOnlineSocket(socket.request.user.id, socket.id);
    await broadcastUserStatus(io, socket.request.user.id, User_Status.Online);

    // TODO get statuses of friends
    const heartbeat = setInterval(async () => {
      console.log('socket still connected');

      if (!io.sockets.sockets.has(socket.id)) {
        await userStatusService.removeOnlineSocket(socket.request.user.id, socket.id);

        await broadcastUserStatus(io, socket.request.user.id, User_Status.Offline);
        console.log('socket disconnected now');

        clearInterval(heartbeat);
      }
    }, ENV_VAR.SOCKET_HEARTBEAT_RATE * 1000);
  } catch (err) {
    console.log('error handling user events', err);
  }

  // socket.on(SocketEvents.Disconnecting, async () => {});
};
