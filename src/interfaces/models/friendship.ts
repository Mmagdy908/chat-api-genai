import { Types } from 'mongoose';
import { Friendship_Status } from '../../enums/friendshipEnums';

export interface Friendship {
  id: string;
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  status: Friendship_Status;
  userPair?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
