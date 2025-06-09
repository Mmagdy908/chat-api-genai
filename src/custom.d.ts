import { User } from './interfaces/models/user';

declare namespace Express {
  export interface Request {
    user?: User;
  }
}
