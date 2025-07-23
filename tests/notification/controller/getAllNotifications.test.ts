import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { getMockReq, getMockRes } from '@jest-mock/express';
import {
  getAllNotifications,
  getUnreadNotificationsCount,
} from '../../../src/controllers/http/notificationController';
import * as notificationService from '../../../src/services/notificationService';
import * as notificationSchemas from '../../../src/schemas/notificationSchemas';
import { Request, Response, NextFunction } from 'express';
import { userFactory } from '../../utils/userFactory';
import { Notification_Status } from '../../../src/enums/notificationEnums';
import userModel from '../../../src/models/user';
import notificationModel from '../../../src/models/notification';
import { notificationFactory } from '../../utils/notificationFactory';

jest.mock('../../../src/services/notificationService');
jest.mock('../../../src/schemas/notificationSchemas');

describe('getAllNotifications controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    const user = new userModel(userFactory.create({ isVerified: true }));
    req = getMockReq({
      user: { id: user.id },
    });
    ({ res, next } = getMockRes());
    next = jest.fn();
  });

  test('should fetch all notifications and return success response', async () => {
    // Arrange
    const notifications = [
      new notificationModel(notificationFactory.create({ recipient: req.user?.id })),
      new notificationModel(notificationFactory.create({ recipient: req.user?.id })),
    ] as notificationSchemas.GetNotificationResponse[];

    const mappedNotifications = notifications.map((notif) => ({ ...notif, mapped: true }));
    req.query = { limit: '10', before: 'notif3' };
    jest.mocked(notificationService.getAllByChat).mockResolvedValue(notifications);
    jest
      .mocked(notificationSchemas.mapGetResponse)
      .mockImplementation((notif) => ({ ...notif, mapped: true }));

    // Act
    await getAllNotifications(req as Request, res as Response, next);

    // Assert
    expect(notificationService.getAllByChat).toHaveBeenCalledWith(
      req.user?.id as string,
      '10',
      'notif3'
    );
    expect(notificationSchemas.mapGetResponse).toHaveBeenCalledTimes(notifications.length);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { notifications: mappedNotifications },
      results: notifications.length,
      message: 'Notifications are fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return empty array for no notifications', async () => {
    // Arrange
    req.query = { limit: '10' };
    jest.mocked(notificationService.getAllByChat).mockResolvedValue([]);

    // Act
    await getAllNotifications(req as Request, res as Response, next);

    // Assert
    expect(notificationService.getAllByChat).toHaveBeenCalledWith(
      req.user?.id as string,
      '10',
      undefined
    );
    expect(notificationSchemas.mapGetResponse).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { notifications: [] },
      results: 0,
      message: 'Notifications are fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
