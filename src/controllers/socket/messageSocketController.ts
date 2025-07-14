import { Server, Socket } from 'socket.io';
import * as messageSchemas from '../../schemas/messageSchemas';
import * as messageService from '../../services/messageService';
import { handleSocketResponse } from '../../socket/socketUtils';
import { handleError } from '../../util/appError';
import { SocketEvents } from '../../enums/socketEventEnums';

export const sendMessage =
  (io: Server, socket: Socket) =>
  async (messageData: messageSchemas.SendMessageRequest, callback: () => void) => {
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
  };
