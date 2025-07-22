import { Types } from 'mongoose';
import {
  Notification_Status,
  Notification_Type,
  Reference_Type,
} from '../../enums/notificationEnums';
import { User } from './user';

export interface Notification {
  id: string;
  type: Notification_Type;
  sender: Types.ObjectId | User;
  recipient: Types.ObjectId;
  status: Notification_Status;
  reference: Types.ObjectId;
  referenceType: Reference_Type;
  createdAt: Date;
  updatedAt: Date;
}
