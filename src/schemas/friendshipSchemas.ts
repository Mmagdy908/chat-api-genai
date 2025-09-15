import { z } from 'zod/v4';
import { Types } from 'mongoose';
import { Friendship_Status } from '../enums/friendshipEnums';
import { Friendship } from '../interfaces/models/friendship';

const sendFriendshipRequestSchema = z.object({
  recipientId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
});

const respondToFriendshipRequestSchema = z.object({
  friendshipId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  status: z.enum([Friendship_Status.Accepted, Friendship_Status.Rejected]),
});

const sendFriendshipResponseSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  sender: z.custom<Types.ObjectId>().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  recipient: z.custom<Types.ObjectId>().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  status: z.enum(Friendship_Status),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

const respondToFriendshipResponseSchema = sendFriendshipResponseSchema;

export const mapSendRequest = (friendshipData: z.infer<typeof sendFriendshipRequestSchema>) =>
  sendFriendshipRequestSchema.parse({
    recipientId: friendshipData.recipientId,
  });

export const mapRespondRequest = (
  friendshipData: z.infer<typeof respondToFriendshipRequestSchema>
) =>
  respondToFriendshipRequestSchema.parse({
    friendshipId: friendshipData.friendshipId,
    status: friendshipData.status,
  });

export const mapSendResponse = (friendship: Friendship) =>
  respondToFriendshipResponseSchema.parse({
    id: friendship.id,
    sender: friendship.sender,
    recipient: friendship.recipient,
    status: friendship.status,
    createdAt: friendship.createdAt,
    updatedAt: friendship.updatedAt,
  });

export const mapRespondResponse = mapSendResponse;
