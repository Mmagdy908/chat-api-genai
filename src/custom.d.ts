import { Chat } from './interfaces/models/chat';
import { User } from './interfaces/models/user';

declare namespace Express {
  export interface Request {
    user?: User;
    chat?: Chat;
  }
}

declare module 'http' {
  interface IncomingMessage {
    user: User;
    chat: Chat;
  }
}
