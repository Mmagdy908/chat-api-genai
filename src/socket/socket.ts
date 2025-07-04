import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../enums/socketEventEnums';
import { wrap } from './socketUtils';
import { protect } from '../middlewares/authMiddleware';
import { handleMessageEvents } from './handlers/message';
import { handleChatEvents } from './handlers/chat';
import { handleError } from '../util/appError';
export const setupSocket = (io: Server) => {
  io.use(wrap(protect));

  io.on(SocketEvents.Connection, (socket) => {
    console.log('a user connected');
    // console.log(socket.request.user);

    socket.on('hello', (data) => {
      console.log(data);
    });
    setTimeout(() => {
      socket.emit('hello', { message: 'hello from server' });
    }, 5000);

    // Register all socket events
    handleChatEvents(io, socket);
    handleMessageEvents(io, socket);

    socket.on(SocketEvents.Disconnect, () => {
      console.log('a user disconnected');
    });
  });

  io.on('error', (error) => {
    console.log('Socket.IO server error:', error);
  });
};
