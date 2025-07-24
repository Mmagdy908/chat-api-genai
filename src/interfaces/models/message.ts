import { Types } from 'mongoose';
import { Message_Status, Message_Type } from '../../enums/messageEnums';
import { User } from './user';

export interface Message {
  id: string;
  chat: Types.ObjectId;
  sender: Types.ObjectId | User;
  status: Message_Status;
  deliveredTo: Types.ObjectId[];
  seenBy: Types.ObjectId[];
  content: {
    contentType: Message_Type;
    text: string;
    mediaUrl: string;
  };
  genai: boolean;
  createdAt: Date;
  updatedAt: Date;
}
