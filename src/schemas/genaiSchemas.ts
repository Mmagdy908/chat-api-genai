import { Types } from 'mongoose';
import z from 'zod/v4';
import { Message_Status, Message_Type } from '../enums/messageEnums';
import { Message } from '../interfaces/models/message';
import { Notification_Status, Notification_Type, Reference_Type } from '../enums/notificationEnums';

const sendGenaiRequestSchema = z.object({
  chatId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),

  messageId: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  append: z.string(),
  done: z.boolean().default(true).optional(),
});

export type SendGenaiRequest = z.infer<typeof sendGenaiRequestSchema>;

export const mapSendGenaiRequest = (data: SendGenaiRequest): SendGenaiRequest =>
  sendGenaiRequestSchema.parse(data);
