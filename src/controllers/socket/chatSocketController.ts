import { Server, Socket } from 'socket.io';
import * as chatService from '../../services/chatService';
import { handleSocketResponse } from '../../socket/socketUtils';
import { handleError } from '../../util/appError';

export const joinUserChats = (io: Server, socket: Socket) => async (userId: string) => {
  try {
    const userChats = (await chatService.getAllChatsByMember(userId)).map(
      (chat) => `chat:${chat.id}`
    );
    socket.join(userChats);
  } catch (err) {
    console.log('error joining user chats', err);
  }
};

export const joinChat =
  (io: Server, socket: Socket) => async (chatId: string, callback: () => void) => {
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
  };
