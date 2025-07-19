import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../enums/socketEventEnums';
import { wrap } from './socketUtils';
import { protect } from '../middlewares/authMiddleware';
import { handleUserEvents } from './handlers/user';
import { handleChatEvents } from './handlers/chat';
import * as userSocketController from '../controllers/socket/userSocketController';
import { handleMessageEvents } from './handlers/message';
import { subscriber } from '../config/redis';
import ENV_VAR from '../config/envConfig';
import { connectProducer } from '../kafka/producer';
import { messageConsumer } from '../kafka/consumer';

export const setupSocket = async (io: Server) => {
  io.use(wrap(protect));

  if (ENV_VAR.PROCESS_ID === 0)
    subscriber.subscribe('__keyevent@0__:expired', userSocketController.handleKeyExpiredEvent(io));

  await connectProducer();
  await messageConsumer(io)();

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
