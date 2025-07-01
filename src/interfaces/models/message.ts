import { Types } from 'mongoose';
import { Message_Status, Message_Type } from '../../enums/messageEnums';

export interface Message {
  id: string;
  chat: Types.ObjectId;
  sender: Types.ObjectId;
  status: Message_Status;
  type: Message_Type;
  content: {
    text: string;
    mediaUrl: string;
  };
  created_at: Date;
  updated_at: Date;
}
