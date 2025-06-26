import { Types } from 'mongoose';
import { Friendship_Status } from '../../enums/friendshipEnums';

export interface Friendship {
  id: Types.ObjectId;
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  status: Friendship_Status;
  createdAt: Date;
  updatedAt: Date;
}
