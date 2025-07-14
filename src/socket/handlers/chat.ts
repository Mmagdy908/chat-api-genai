import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../enums/socketEventEnums';
import * as chatController from '../../controllers/socket/chatSocketController';

export const handleChatEvents = (io: Server, socket: Socket) => {
  // join chats on user connection
  chatController.joinUserChats(io, socket)(socket.request.user.id);

  socket.on(SocketEvents.Chat_Join, chatController.joinChat(io, socket));
};
