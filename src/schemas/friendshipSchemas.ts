import { z } from 'zod';
import { Types } from 'mongoose';

export const createFriendshipRequestSchema = z.object({
  recipientId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid ObjectId format',
  }),
});

export const createFriendshipResponseSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid ObjectId format',
  }),
  sender: z.custom<Types.ObjectId>().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid ObjectId format',
  }),
  recipient: z.custom<Types.ObjectId>().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid ObjectId format',
  }),
  status: z.string(),
});

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
