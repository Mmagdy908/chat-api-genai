import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../enums/socketEventEnums';
import * as messageSchemas from '../../schemas/messageSchemas';
import * as messageService from '../../services/messageService';
import { handleSocketResponse } from '../socketUtils';
import { handleError } from '../../util/appError';

export const handleMessageEvents = (io: Server, socket: Socket) => {
  socket.on(
    SocketEvents.Message,
    async (messageData: messageSchemas.SendMessageRequest, callback) => {
      try {
        messageData.sender = socket.request.user.id;
        const mappedMessageData = messageSchemas.mapSendRequest(messageData);
        const message = await messageService.send(mappedMessageData);

        const response = {
          status: 'success',
          statusCode: 200,
          message: 'Successfully sent message',
        };

        handleSocketResponse(callback, response);
        io.to(`chat:${message.chat.toString()}`).emit(
          SocketEvents.Message,
          messageSchemas.mapSendResponse(message)
        );
      } catch (err: any) {
        console.log(err);
        handleSocketResponse(callback, handleError(err));
      }
    }
  );
};
