import { Schema } from 'mongoose';
import { Friendship_Status } from '../../enums/friendshipEnums';

export interface Friendship {
  id: Schema.Types.ObjectId;
  sender: Schema.Types.ObjectId;
  recipient: Schema.Types.ObjectId;
  status: Friendship_Status;
  createdAt: Date;
  updatedAt: Date;
}
