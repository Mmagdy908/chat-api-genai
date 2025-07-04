import { model, Schema } from 'mongoose';
import { Message } from '../interfaces/models/message';
import { Message_Status } from '../enums/messageEnums';

const messageSchema = new Schema<Message>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'A message must belong to a chat'],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A message must jave a sender'],
    },
    status: {
      type: String,
      enum: {
        values: ['Sent', 'Delivered', 'Seen'],
        message: 'Message status must be either Sent, Delivered or Seen',
      },
      default: Message_Status.Sent,
      required: [true, 'A message must have a status'],
    },
    content: {
      contentType: {
        type: String,
        enum: {
          values: ['Text', 'Image', 'Video', 'Audio', 'File'],
          message: 'Message type must be either Text, Image, Video, Audio or File',
        },
        required: [true, 'A message must have a type'],
      },
      text: String,
      mediaUrl: String,
    },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

export default model<Message>('Message', messageSchema);
