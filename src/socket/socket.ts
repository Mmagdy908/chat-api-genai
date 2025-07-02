import { Server } from 'socket.io';
import { SocketEvents } from '../enums/socketEventEnums';

export const setupSocket = (io: Server) => {
  io.on(SocketEvents.Connection, (socket) => {
    console.log('a user connected');

    socket.on(SocketEvents.Disconnect, () => {
      console.log('a user disconnected');
    });
  });
};
