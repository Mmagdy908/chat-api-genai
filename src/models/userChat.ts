import { Schema, model } from 'mongoose';
import { UserChat } from '../interfaces/models/userChat';

const userChatSchema = new Schema<UserChat>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UserChat must have user'],
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'UserChat must have chat'],
    },
    lastDeliveredMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastSeenMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true }, timestamps: true }
);

export default model<UserChat>('UserChat', userChatSchema);
