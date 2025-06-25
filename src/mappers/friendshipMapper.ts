import { z } from 'zod';
import { Types } from 'mongoose';
import { Friendship } from '../interfaces/models/friendship';
const createFriendshipRequestSchema = z.object({
  senderId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid ObjectId format',
  }),
  recipientId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid ObjectId format',
  }),
});

const createFriendshipResponseSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid ObjectId format',
  }),
  sender: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid ObjectId format',
  }),
  recipient: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid ObjectId format',
  }),
  status: z.string(),
});

export const mapCreateRequest = (friendshipData: { senderId: string; recipientId: string }) =>
  createFriendshipRequestSchema.parse({
    senderId: friendshipData.senderId,
    recipientId: friendshipData.recipientId,
  });

export const mapCreateResponse = (friendship: Friendship) =>
  createFriendshipResponseSchema.parse({
    id: friendship.id,
    sender: friendship.sender,
    recipient: friendship.recipient,
    status: friendship.status,
  });
