import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../enums/socketEventEnums';

export const handleChatEvents = (io: Server, socket: Socket) => {
  socket.on(SocketEvents.Join, (chatId: string) => {
    socket.join(`chat:${chatId}`);
    console.log(`user : ${socket.request.user.id} joined chat : ${chatId}`);
  });
};
