import {
  GetNotificationResponse,
  SendNotificationRequest,
  SendNotificationResponse,
} from '../schemas/notificationSchemas';
import notificationModel from '../models/notification';
import { toObjectId } from '../util/objectIdUtil';
import { Notification_Status } from '../enums/notificationEnums';

export const create = async (
  notificationData: SendNotificationRequest
): Promise<SendNotificationResponse> => {
  const notification = await notificationModel.create(notificationData);
  return await notification.populate({
    path: 'sender',
    select: 'firstName lastName photo',
  });
};

export const getAll = async (
  userId: string,
  limit: string,
  before?: string
): Promise<GetNotificationResponse[]> => {
  const query = notificationModel
    .find({ recipient: userId })
    .sort('-_id')
    .limit(parseInt(limit))
    .populate({
      path: 'sender',
      select: 'firstName lastName photo',
    });

  if (before) query.find({ _id: { $lt: toObjectId(before) } });

  return (await query) as GetNotificationResponse[];
};

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  return (await notificationModel.find({ recipient: userId, status: Notification_Status.Unread }))
    .length;
};

export const markNotificationsAsRead = async (userId: string) => {
  await notificationModel.updateMany(
    { recipient: userId, status: Notification_Status.Unread },
    {
      status: Notification_Status.Read,
    }
  );
};
