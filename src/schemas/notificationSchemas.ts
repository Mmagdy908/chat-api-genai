import { Types } from 'mongoose';
import z from 'zod/v4';
import { Message_Status, Message_Type } from '../enums/messageEnums';
import { Message } from '../interfaces/models/message';
import { Notification_Status, Notification_Type, Reference_Type } from '../enums/notificationEnums';

const sendNotificationRequestSchema = z.object({
  type: z.enum(Notification_Type),
  sender: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  recipient: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  reference: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  referenceType: z.enum(Reference_Type),
});

const sendFriendshipNotificationResponseSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  type: z.enum(Notification_Type),
  sender: z.object({
    id: z.string().refine((value) => Types.ObjectId.isValid(value), {
      message: 'Invalid id format',
    }),
    firstName: z.string(),
    lastName: z.string(),
    photo: z.string().optional(),
  }),
  recipient: z.custom<Types.ObjectId>().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  reference: z.custom<Types.ObjectId>().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  referenceType: z.enum(Reference_Type),
  status: z.enum(Notification_Status),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SendNotificationRequest = z.infer<typeof sendNotificationRequestSchema>;
export type SendNotificationResponse = z.infer<typeof sendFriendshipNotificationResponseSchema>;

export const mapSendRequest = (notificationData: SendNotificationRequest) =>
  sendNotificationRequestSchema.parse(notificationData);

export const mapSendResponse = (notification: SendNotificationResponse) =>
  sendFriendshipNotificationResponseSchema.parse({
    id: notification.id,
    type: notification.type,
    sender: {
      id: notification.sender.id,
      firstName: notification.sender.firstName,
      lastName: notification.sender.lastName,
      photo: notification.sender.photo,
    },
    recipient: notification.recipient,
    reference: notification.reference,
    referenceType: notification.referenceType,
    status: notification.status,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  });
