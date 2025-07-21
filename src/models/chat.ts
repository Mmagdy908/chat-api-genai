import { model, Schema } from 'mongoose';
import { Chat } from '../interfaces/models/chat';
import { Chat_Type } from '../enums/chatEnums';

const chatSchema = new Schema<Chat>(
  {
    owner: Schema.Types.ObjectId, // only for group chats
    admins: [Schema.Types.ObjectId], // only for group chats
    // only for group chats
    metaData: {
      name: {
        type: String,
      },
      description: {
        type: String,
      },
      image: {
        type: String,
      },
    },
    type: {
      type: String,
      enum: {
        values: ['Private', 'Group'],
        message: 'Chat type must be either Private or Group',
      },
      required: [true, 'A chat must have a type'],
    },
    members: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      validate: {
        validator: function (members) {
          if (this.type === Chat_Type.Private && members.length < 2) return false;
          if (this.type === Chat_Type.Group && members.length < 1) return false;

          return true;
        },
        message:
          'A private chat must have at least two members and a group chat must have at least one member',
      },
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

export default model<Chat>('Chat', chatSchema);
