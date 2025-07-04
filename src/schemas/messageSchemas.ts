import { Types } from 'mongoose';
import z from 'zod/v4';
import { Message_Status, Message_Type } from '../enums/messageEnums';
import { Message } from '../interfaces/models/message';

const sendMessageRequestSchema = z.object({
  chat: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  sender: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  content: z
    .object({
      contentType: z.enum(Message_Type),
      text: z.string().optional(),
      mediaUrl: z.string().optional(),
    })
    .check((ctx) => {
      const { contentType, text, mediaUrl } = ctx.value;
      if (contentType === Message_Type.Text) {
        if (!text)
          ctx.issues.push({ input: '', code: 'custom', message: 'Text content must have text' });
      } else if (!mediaUrl) {
        ctx.issues.push({ input: '', code: 'custom', message: 'Media content must have mediaUrl' });
      }
    }),
});

const sendMessageResponseSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  chat: z.custom<Types.ObjectId>().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  sender: z.object({
    id: z.string().refine((value) => Types.ObjectId.isValid(value), {
      message: 'Invalid id format',
    }),
    firstName: z.string(),
    lastName: z.string(),
    photo: z.string().optional(),
  }),
  status: z.enum(Message_Status),
  content: z.object({
    contentType: z.enum(Message_Type),
    text: z.string().optional(),
    mediaUrl: z.string().optional(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;
export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>;

export const mapSendRequest = (messageData: SendMessageRequest) =>
  sendMessageRequestSchema.parse(messageData);

export const mapSendResponse = (message: SendMessageResponse) =>
  sendMessageResponseSchema.parse({
    id: message.id,
    chat: message.chat,
    sender: {
      id: message.sender.id,
      firstName: message.sender.firstName,
      lastName: message.sender.lastName,
      photo: message.sender.photo,
    },
    status: message.status,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  });
