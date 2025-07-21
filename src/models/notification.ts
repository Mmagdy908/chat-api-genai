import { Schema, model } from 'mongoose';
import { Notification } from '../interfaces/models/notification';
import { Notification_Status, Notification_Type, Reference_Type } from '../enums/notificationEnums';

const notificationSchema = new Schema<Notification>(
  {
    type: {
      type: String,
      required: [true, 'A notification must have a type'],
      enum: {
        values: [
          Notification_Type.Accepted_Friend_Request,
          Notification_Type.Received_Friend_Request,
        ],
        message:
          'Notification type must be either received_friend_request or accepted_friend_request',
      },
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A notification must have a sender'],
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A notification must have a receiver'],
    },
    status: {
      type: String,
      enum: {
        values: [Notification_Status.Read, Notification_Status.Unread],
        message: 'Notification status must be either read or unread',
      },
      default: Notification_Status.Unread,
    },
    reference: {
      type: Schema.Types.ObjectId,
      refPath: 'referenceType',
      required: [true, 'A notification must have a reference'],
    },
    referenceType: {
      type: String,
      enum: {
        values: [Reference_Type.Friendship],
        message: 'Notification status must be either Friendship or ...',
      },
    },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

export default model<Notification>('Notification', notificationSchema);
