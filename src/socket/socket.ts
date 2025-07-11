import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../enums/socketEventEnums';
import { wrap } from './socketUtils';
import { protect } from '../middlewares/authMiddleware';
import { handleUserEvents, handleKeyExpiredEvent } from './handlers/user';
import { handleChatEvents } from './handlers/chat';
import { handleMessageEvents } from './handlers/message';
import { subscriber } from '../config/redis';
import ENV_VAR from '../config/envConfig';

export const setupSocket = (io: Server) => {
  io.use(wrap(protect));

  if (ENV_VAR.PROCESS_ID === 0)
    subscriber.subscribe('__keyevent@0__:expired', handleKeyExpiredEvent(io));

  io.on(SocketEvents.Connection, (socket) => {
    console.log('a user connected');

    // Register all socket events
    handleUserEvents(io, socket);
    handleChatEvents(io, socket);
    handleMessageEvents(io, socket);
  });

  io.on('error', (error) => {
    console.log('Socket.IO server error:', error);
  });
};
