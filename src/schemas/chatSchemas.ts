import { Types } from 'mongoose';
import { z } from 'zod/v4';
import { Chat_Type } from '../enums/chatEnums';
import { sendMessageResponseSchema } from './messageSchemas';
import * as messageSchemas from './messageSchemas';

const createGroupChatRequestSchema = z.object({
  owner: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  metaData: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      image: z.url().optional(),
    })
    .optional(),
  members: z
    .array(
      z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid id format',
      })
    )
    .optional(),
});

const getChatResponseSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  owner: z
    .custom<Types.ObjectId>()
    .refine((value) => Types.ObjectId.isValid(value), {
      message: 'Invalid id format',
    })
    .optional(),
  admins: z
    .array(
      z.custom<Types.ObjectId>().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid id format',
      })
    )
    .optional(),
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

export type CreateGroupChatRequest = z.infer<typeof createGroupChatRequestSchema>;
export type GetChatResponse = z.infer<typeof getChatResponseSchema>;

export const mapCreateGroupRequest = (chat: CreateGroupChatRequest) =>
  createGroupChatRequestSchema.parse({
    owner: chat.owner,
    metaData: chat.metaData,
    members: chat.members,
  });

export const mapGetResponse = (chat: GetChatResponse) =>
  getChatResponseSchema.parse({
    id: chat.id,
    owner: chat.owner,
    admins: chat.admins,
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
