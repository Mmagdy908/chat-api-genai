import { Types } from 'mongoose';
import z from 'zod/v4';
import { Message_Status, Message_Type } from '../enums/messageEnums';
import { User } from '../interfaces/models/user';

const getAllMessagesRequestSchema = z.object({
  chatId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  before: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: 'Invalid id format',
    })
    .optional(),
});

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
  genaiStreaming: z.boolean().default(false).optional(),
});

const sendGenaiMessageRequestSchema = z.object({
  chat: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  content: z.object({
    contentType: z.literal(Message_Type.Text),
    text: z.string(),
    mediaUrl: z.url().optional(),
  }),
  prompt: z.object({
    text: z.string().optional(),
    mediaUrl: z.string().optional(),
  }),
  genai: z.literal(true),
  genaiStreaming: z.boolean().default(false).optional(),
});

export const sendMessageResponseSchema = z.discriminatedUnion('genai', [
  z.object({
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
    genai: z.literal(false),
    done: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  z.object({
    id: z.string().refine((value) => Types.ObjectId.isValid(value), {
      message: 'Invalid id format',
    }),
    chat: z.custom<Types.ObjectId>().refine((value) => Types.ObjectId.isValid(value), {
      message: 'Invalid id format',
    }),
    // sender: z.object({
    //   firstName: z.literal('gemini'),
    //   lastName: z.literal('genai'),
    //   photo: z.string().optional(),
    // }),
    status: z.enum(Message_Status),
    content: z.object({
      contentType: z.enum(Message_Type),
      text: z.string(),
    }),
    genai: z.literal(true),
    done: z.boolean().default(true).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
]);

export const getMessageResponseSchema = z.object({
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
  deliveredTo: z
    .array(
      z.custom<Types.ObjectId>().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid id format',
      })
    )
    .optional(),
  seenBy: z
    .array(
      z.custom<Types.ObjectId>().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid id format',
      })
    )
    .optional(),
  genai: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;
export type SendGenaiMessageRequest = z.infer<typeof sendGenaiMessageRequestSchema>;
export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>;
export type GetMessageResponse = z.infer<typeof getMessageResponseSchema>;

export const mapSendRequest = (messageData: SendMessageRequest) =>
  sendMessageRequestSchema.parse(messageData);

export const mapGenaiSendRequest = (messageData: SendGenaiMessageRequest) =>
  sendGenaiMessageRequestSchema.parse(messageData);

export const mapSendResponse = (message: SendMessageResponse) =>
  sendMessageResponseSchema.parse({
    id: message.id,
    chat: message.chat,
    sender: message.genai
      ? undefined
      : {
          id: (message.sender as User).id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          photo: message.sender.photo,
        },
    status: message.status,
    content: message.content,
    genai: message.genai,
    done: message.done,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  });

export const mapGetResponse = (message: GetMessageResponse) => {
  return getMessageResponseSchema.parse({
    id: message.id,
    chat: message.chat,
    sender: message.genai
      ? undefined
      : {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          photo: message.sender.photo,
        },
    status: message.status,
    content: message.content,
    genai: message.genai,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  });
};

export const mapGetSenderMessageResponse = (message: GetMessageResponse) => {
  return getMessageResponseSchema.parse({
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
    deliveredTo: message.deliveredTo,
    seenBy: message.seenBy,
    genai: message.genai,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  });
};
