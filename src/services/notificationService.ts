import { SendNotificationRequest, SendNotificationResponse } from '../schemas/notificationSchemas';
import * as notificationRepository from '../repositories/notificationRepository';

export const send = async (
  notificationData: SendNotificationRequest
): Promise<SendNotificationResponse> => {
  return await notificationRepository.create(notificationData);
};
