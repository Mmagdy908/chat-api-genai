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
describe('getUnreadNotificationsCount controller', () => {
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

  test('should fetch unread notifications count and return success response', async () => {
    // Arrange
    const count = 3;
    jest.mocked(notificationService.getUnreadNotificationsCount).mockResolvedValue(count);

    // Act
    await getUnreadNotificationsCount(req as Request, res as Response, next);

    // Assert
    expect(notificationService.getUnreadNotificationsCount).toHaveBeenCalledWith(
      req.user?.id as string
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { count },
      message: 'Unread notifications count is fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 0 for no unread notifications', async () => {
    // Arrange
    jest.mocked(notificationService.getUnreadNotificationsCount).mockResolvedValue(0);

    // Act
    await getUnreadNotificationsCount(req as Request, res as Response, next);

    // Assert
    expect(notificationService.getUnreadNotificationsCount).toHaveBeenCalledWith(
      req.user?.id as string
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { count: 0 },
      message: 'Unread notifications count is fetched successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
