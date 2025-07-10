import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../enums/socketEventEnums';
import * as userService from '../../services/userService';
import * as userStatusService from '../../services/userStatusService';
import * as chatService from '../../services/chatService';
import { User_Status } from '../../enums/userEnums';
import ENV_VAR from '../../config/envConfig';
import { handleSocketResponse } from '../socketUtils';
import { handleError } from '../../util/appError';

const sendFriendsStatus = async (socket: Socket, userId: string) => {
  try {
    const friends = await userService.getUserFriends(socket.request.user.id);
    const friendsStatuses = await Promise.all(
      friends.map(async (friendId) => await userStatusService.getUserStatus(friendId))
    );
    const friendsWithStatus = friends.map((friendId, index) => ({
      userId: friendId,
      status: friendsStatuses[index],
    }));

    socket.emit(SocketEvents.Friends_Status, friendsWithStatus);
  } catch (err) {
    console.log('error handling sending friends status', err);
  }
};

const updateAndBroadcastUserStatus = async (io: Server, userId: string, status: User_Status) => {
  try {
    const { status: oldStatus, lastActive } = await userStatusService.getUserStatus(userId);

    await userStatusService.setUserStatus(userId, status);

    if (oldStatus === status) return; //#####

    const userChats = (await chatService.getAllChatsByMember(userId)).map(
      (chat) => `chat:${chat.id}`
    );

    io.to(userChats).emit(SocketEvents.User_Status_Update, {
      userId,
      status,
      lastActive,
    });
  } catch (err) {
    console.log('error handling broadcasting user status', err);
  }
};

export const handleUserEvents = async (io: Server, socket: Socket) => {
  try {
    // add socket and broadcast if status changes
    await userStatusService.addOnlineSocket(socket.request.user.id, socket.id);

    updateAndBroadcastUserStatus(io, socket.request.user.id, User_Status.Online);

    // send statuses of friends to newly joined user
    sendFriendsStatus(socket, socket.request.user.id);

    // TODO    IMPLEMENT HEARTBEAT
    // heartbeat
    // const heartbeat = setInterval(async () => {
    //   // console.log('socket still connected');

    //   if (!io.sockets.sockets.has(socket.id)) {
    //     // remove socket and broadcast if status changes
    //     await userStatusService.removeOnlineSocket(socket.request.user.id, socket.id);

    //     broadcastUserStatus(io, socket.request.user.id, User_Status.Offline);
    //     // console.log('socket disconnected now');

    //     clearInterval(heartbeat);
    //   }
    // }, ENV_VAR.SOCKET_HEARTBEAT_RATE * 1000);

    socket.on(SocketEvents.Disconnect, () => {
      setTimeout(async () => {
        await userStatusService.removeOnlineSocket(socket.request.user.id, socket.id);
        //#####
        // AVOID broadcasting in case of rapid reconnection
        if ((await userStatusService.getOnlineSocketsCount(socket.request.user.id)) === 0) {
          updateAndBroadcastUserStatus(io, socket.request.user.id, User_Status.Offline);
        }
      }, ENV_VAR.SOCKET_GRACE_PERIOD * 1000);
    });
  } catch (err) {
    console.log('error handling user events', err);
  }
};
