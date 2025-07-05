import { SocketResponse } from '../interfaces/sockets/responses';
import { Middleware } from '../types/middleware';

export const wrap = (middleware: Middleware) => (socket: any, next: (err?: any) => void) => {
  middleware(socket.request, {} as any, next);
};

export const handleSocketResponse = (
  callback: (response: SocketResponse) => void,
  response: SocketResponse
) => {
  const { status, statusCode, message, data } = response;
  if (callback) callback({ status, statusCode, message, data });
};

// export const handleSocketError = (callback: (err: any) => void, err: any) => {
//   const { status, statusCode, message } = handleError(err);
//   if (callback) callback({ status, statusCode, message });
// };
