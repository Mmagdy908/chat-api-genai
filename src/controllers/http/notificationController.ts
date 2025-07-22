import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../../services/notificationService';
import catchAsync from '../../util/catchAsync';
import { GetNotificationResponse, mapGetResponse } from '../../schemas/notificationSchemas';

export const getAllNotifications = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const notifications = await notificationService.getAllByChat(
      req.user.id,
      req.query.limit as string,
      req.query.before as string
    );

    res.status(200).json({
      status: 'success',
      data: {
        notifications: notifications.map((notification: GetNotificationResponse) =>
          mapGetResponse(notification)
        ),
      },
      results: notifications.length,
      message: 'Notifications are fetched successfully',
    });
  }
);

export const getUnreadNotificationsCount = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const count = await notificationService.getUnreadNotificationsCount(req.user.id);

    res.status(200).json({
      status: 'success',
      data: { count },
      message: 'Unread notifications count is fetched successfully',
    });
  }
);
