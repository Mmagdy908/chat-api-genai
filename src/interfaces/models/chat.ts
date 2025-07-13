import { Types } from 'mongoose';
import { Chat_Type } from '../../enums/chatEnums';
import { Message } from './message';

export interface Chat {
  id: string;
  metaData?: {
    name?: string;
    description?: string;
    image?: string;
  };
  type: Chat_Type;
  members: Types.ObjectId[];
  lastMessage: Types.ObjectId | Message;
  createdAt: Date;
  updatedAt: Date;
}
