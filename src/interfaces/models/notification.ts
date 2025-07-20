import { Types } from 'mongoose';
import {
  Notification_Status,
  Notification_Type,
  Reference_Type,
} from '../../enums/notificationEnums';

export interface Notification {
  id: string;
  type: Notification_Type;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  status: Notification_Status;
  reference: Types.ObjectId;
  referenceType: Reference_Type;
  createdAt: Date;
  updatedAt: Date;
}
