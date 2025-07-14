import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../enums/socketEventEnums';
import * as messageController from '../../controllers/socket/messageSocketController';

export const handleMessageEvents = (io: Server, socket: Socket) => {
  socket.on(SocketEvents.Message, messageController.sendMessage(io, socket));
};
