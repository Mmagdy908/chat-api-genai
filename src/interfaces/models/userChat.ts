import { Types } from 'mongoose';

export interface UserChat {
  id: string;
  user: Types.ObjectId;
  chat: Types.ObjectId;
  lastDeliveredMessage: Types.ObjectId;
  lastSeenMessage: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
