import { SendNotificationRequest, SendNotificationResponse } from '../schemas/notificationSchemas';
import notificationModel from '../models/notification';

export const create = async (
  notificationData: SendNotificationRequest
): Promise<SendNotificationResponse> => {
  const notification = await notificationModel.create(notificationData);
  return await notification.populate({
    path: 'sender',
    select: 'firstName lastName photo',
  });
};
