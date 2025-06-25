import { Schema, model } from 'mongoose';
import { Friendship } from '../interfaces/models/friendship';
import { Friendship_Status } from '../enums/friendshipEnums';

const friendshipSchema = new Schema<Friendship>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A friendship must have a sender'],
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A friendship must have a recipient'],
    },
    status: {
      type: String,
      enum: {
        values: ['Accepted', 'Rejected', 'Pending'],
        message: 'Friendship status must be either Accepted, Rejected or Pending',
      },
      default: Friendship_Status.Pending,
    },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

friendshipSchema.index({ sender: 1, recipient: 1 }, { unique: true });

export default model<Friendship>('Friendship', friendshipSchema);
