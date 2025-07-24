import { Server, Socket } from 'socket.io';
import { SendGenaiRequest } from '../../schemas/genaiSchemas';
import * as messageService from '../../services/messageService';
import { SocketEvents } from '../../enums/socketEventEnums';
import app from '../../app';

export const sendResponseAppend =
  (io: Server, socket?: Socket) => async (appendData: SendGenaiRequest) => {
    try {
      await messageService.appendMessageText(appendData.messageId, appendData.append);

      io.to(`chat:${appendData.chatId}`).emit(SocketEvents.Genai_Response_Append, appendData);
    } catch (err) {
      console.error('Kafka genai message processing error:', err);
    }
  };
// chatId: prompt.chatId,
// messageId: prompt.messageId,
// append: result.text || '',
// done: true,
