import {
  GetNotificationResponse,
  SendNotificationRequest,
  SendNotificationResponse,
} from '../schemas/notificationSchemas';
import * as notificationRepository from '../repositories/notificationRepository';

export const getAllByChat = async (
  userId: string,
  limit: string,
  before?: string
): Promise<GetNotificationResponse[]> => {
  return await notificationRepository.getAll(userId, limit, before);
};

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  return await notificationRepository.getUnreadNotificationsCount(userId);
};

export const send = async (
  notificationData: SendNotificationRequest
): Promise<SendNotificationResponse> => {
  return await notificationRepository.create(notificationData);
};
