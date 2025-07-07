import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../enums/socketEventEnums';
import { wrap } from './socketUtils';
import { protect } from '../middlewares/authMiddleware';
import { handleUserEvents } from './handlers/user';
import { handleChatEvents } from './handlers/chat';
import { handleMessageEvents } from './handlers/message';
export const setupSocket = (io: Server) => {
  io.use(wrap(protect));

  io.on(SocketEvents.Connection, (socket) => {
    console.log('a user connected');

    // Register all socket events
    handleUserEvents(io, socket);
    handleChatEvents(io, socket);
    handleMessageEvents(io, socket);

    socket.on(SocketEvents.Disconnecting, () => {
      console.log('a user disconnecting');
      // console.log(io.sockets.sockets.has(socket.id));
      console.log(socket.rooms);
    });

    // socket.on(SocketEvents.Disconnect, () => {
    // console.log('a user disconnected');
    // console.log(io.sockets.sockets.has(socket.id));
    // console.log('rooms:', socket.rooms);
    // });
  });

  io.on('error', (error) => {
    console.log('Socket.IO server error:', error);
  });
};
