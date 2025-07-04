import { Middleware } from '../types/middleware';
import { handleError } from '../util/appError';

export const wrap = (middleware: Middleware) => (socket: any, next: (err?: any) => void) => {
  middleware(socket.request, {} as any, next);
};

export const handelSocketError = (callback: (err: any) => void, err: any) => {
  const { status, statusCode, message } = handleError(err);
  callback({ status, statusCode, message });
};
