import { Server, Socket } from 'socket.io';
import * as messageSchemas from '../../schemas/messageSchemas';
import * as messageService from '../../services/messageService';
import { handleSocketResponse } from '../../socket/socketUtils';
import { handleError } from '../../util/appError';
import { SocketEvents } from '../../enums/socketEventEnums';
import { Message_Status } from '../../enums/messageEnums';

export const produceMessage =
  (io: Server, socket: Socket) =>
  async (messageData: messageSchemas.SendMessageRequest, callback: () => void) => {
    try {
      messageData.sender = socket.request.user.id;
      const mappedMessageData = messageSchemas.mapSendRequest(messageData);

      await messageService.produceMessage(mappedMessageData);

      const response = {
        status: 'success',
        statusCode: 200,
        message: 'Successfully sent message',
      };

      handleSocketResponse(callback, response);
    } catch (err) {
      console.log(err);
      handleSocketResponse(callback, handleError(err));
    }
  };

export const sendMessage =
  (io: Server, socket?: Socket) => async (messageData: messageSchemas.SendMessageRequest) => {
    try {
      // messageData.sender = socket.request.user.id;
      const message = await messageService.send(messageData);
      // const response = {
      //   status: 'success',
      //   statusCode: 200,
      //   message: 'Successfully sent message',
      // };

      // handleSocketResponse(callback, response);

      io.to(`chat:${message.chat.toString()}`).emit(
        SocketEvents.Message,
        messageSchemas.mapSendResponse(message)
      );
    } catch (err: any) {
      console.error('Kafka message processing error:', err);
      const { status, statusCode, message, data } = handleError(err.error || err);
      console.log(messageData);
      io.to(`user:${messageData.sender}`).emit(SocketEvents.Custom_Error, {
        status,
        statusCode,
        message,
        data,
        messageId: err.messageId,
      });
      // console.log(err);
      // handleSocketResponse(callback, handleError(err));
    }
  };

export const markMessagesAsDelivered = (io: Server, socket: Socket) => async () => {
  try {
    // 1) update messages statuses
    const messagesPerChat = await messageService.markMessagesAsDelivered(socket.request.user.id);

    // 2) emit new messages statuses to sender
    Object.entries(messagesPerChat).forEach(([senderId, messages]) => {
      io.to(`user:${senderId}`).emit(SocketEvents.Message_Status_Update, {
        userId: socket.request.user.id,
        messages: messages?.map((message) => ({ id: message.id, chat: message.chat.toString() })),
        status: Message_Status.Delivered,
      });
    });
  } catch (err) {
    console.log('error marking messages as delivered: ', err);
  }
};

export const markMessagesAsSeen = (io: Server, socket: Socket) => async (chatId: string) => {
  try {
    // 1) update messages statuses
    const seenMessages = await messageService.markMessagesAsSeen(socket.request.user.id, chatId);

    // 2) emit new messages statuses to sender
    Object.entries(seenMessages).forEach(([senderId, messages]) => {
      io.to(`user:${senderId}`).emit(SocketEvents.Message_Status_Update, {
        userId: socket.request.user.id,
        messages: messages?.map((message) => ({ id: message.id, chat: message.chat.toString() })),
        status: Message_Status.Seen,
      });
    });
  } catch (err) {
    console.log('error marking messges as seen: ', err);
  }
};
