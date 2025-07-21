import { Types } from 'mongoose';
import { z } from 'zod/v4';
import { Chat_Type } from '../enums/chatEnums';
import { sendMessageResponseSchema } from './messageSchemas';
import * as messageSchemas from './messageSchemas';

const getChatResponseSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  metaData: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      image: z.url().optional(),
    })
    .optional(),
  type: z.enum(Chat_Type).optional(),
  members: z
    .array(
      z.object({
        id: z.string().refine((value) => Types.ObjectId.isValid(value), {
          message: 'Invalid id format',
        }),
        firstName: z.string(),
        lastName: z.string(),
        photo: z.string().optional(),
      })
    )
    .optional(),
  lastMessage: sendMessageResponseSchema.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type GetChatResponse = z.infer<typeof getChatResponseSchema>;

export const mapGetResponse = (chat: GetChatResponse) =>
  getChatResponseSchema.parse({
    id: chat.id,
    metaData: chat.metaData,
    type: chat.type,
    members: chat.members?.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      photo: member.photo,
    })),
    lastMessage: chat.lastMessage ? messageSchemas.mapSendResponse(chat.lastMessage) : undefined,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  });
