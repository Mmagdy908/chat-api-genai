import { Types } from 'mongoose';
import { Chat_Type } from '../../enums/chatEnums';

export interface Chat {
  id: string;
  metaData: {
    name: string;
    description: string;
    image: string;
  };
  type: Chat_Type;
  members: Types.ObjectId[];
  lastMessage: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}
