import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../enums/socketEventEnums';
import * as userController from '../../controllers/userController';

export const handleUserEvents = async (io: Server, socket: Socket) => {
  try {
    await userController.connect(io, socket)();

    socket.on(SocketEvents.Heartbeat, userController.heartbeat(io, socket));

    socket.on(SocketEvents.Disconnect, userController.disconnect(io, socket));
  } catch (err) {
    console.log('error handling user events', err);
  }
};
