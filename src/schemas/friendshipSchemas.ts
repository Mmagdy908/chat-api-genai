import { z } from 'zod/v4';
import { Types } from 'mongoose';
import { Friendship_Status } from '../enums/friendshipEnums';

export const sendFriendshipRequestSchema = z.object({
  recipientId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
});

export const respondToFriendshipRequestSchema = z.object({
  friendshipId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  status: z.enum([Friendship_Status.Accepted, Friendship_Status.Rejected]),
});

export const sendFriendshipResponseSchema = z.object({
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
});

export const respondToFriendshipResponseSchema = sendFriendshipResponseSchema;

// export const mapCreateRequest = (friendshipData: z.infer<typeof createFriendshipRequestSchema>) =>
//   createFriendshipRequestSchema.parse({
//     senderId: friendshipData.senderId,
//     recipientId: friendshipData.recipientId,
//   });

// export const mapCreateResponse = (friendship: Friendship) =>
//   createFriendshipResponseSchema.parse({
//     id: friendship.id,
//     sender: friendship.sender,
//     recipient: friendship.recipient,
//     status: friendship.status,
//   });
