import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../enums/socketEventEnums';
import * as userSocketController from '../../controllers/socket/userSocketController';

export const handleUserEvents = async (io: Server, socket: Socket) => {
  try {
    await userSocketController.connect(io, socket)();

    socket.on(SocketEvents.Heartbeat, userSocketController.heartbeat(io, socket));

    socket.on(SocketEvents.Disconnect, userSocketController.disconnect(io, socket));
  } catch (err) {
    console.log('error handling user events', err);
  }
};
