import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../enums/socketEventEnums';
import * as chatService from '../../services/chatService';
import { handleSocketResponse } from '../socketUtils';
import { handleError } from '../../util/appError';

export const handleChatEvents = (io: Server, socket: Socket) => {
  socket.on(SocketEvents.Chat_Join, async (chatId: string, callback) => {
    try {
      await chatService.join(socket.request.user.id, chatId);
      socket.join(`chat:${chatId}`);
      console.log(`user : ${socket.request.user.id} joined chat : ${chatId}`);

      const response = { status: 'success', statusCode: 200, message: 'Successfully joined chat' };
      handleSocketResponse(callback, response);
    } catch (err) {
      console.log(err);
      handleSocketResponse(callback, handleError(err));
    }
  });
};
