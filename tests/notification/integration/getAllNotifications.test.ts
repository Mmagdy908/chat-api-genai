import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import notificationModel from '../../../src/models/notification';
import { userFactory } from '../../utils/userFactory';
import * as authMiddleware from '../../../src/middlewares/authMiddleware';
import { Notification_Status } from '../../../src/enums/notificationEnums';
import { User } from '../../../src/interfaces/models/user';
import { notificationFactory } from '../../utils/notificationFactory';
import { mapPopulatedUser } from '../../utils/mappers';

jest.mock('../../../src/middlewares/authMiddleware');

describe('GET /api/v1/notifications', () => {
  setupIntegrationTests();

  let userId: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Create a user for tests
    const userData = userFactory.create({ isVerified: true });
    const user = await userModel.create(userData);
    userId = user.id;

    // Mock authMiddleware.protect
    jest.mocked(authMiddleware.protect).mockImplementation((req, _res, next) => {
      req.user = { id: userId } as User;
      next();
    });
  });

  test('should fetch all notifications for a user', async () => {
    // Arrange
    const sender = await userModel.create(
      userFactory.create({ email: 'sender@example.con', username: 'sender', isVerified: true })
    );
    const notifications = [
      new notificationModel(notificationFactory.create({ recipient: userId, sender: sender.id })),

      new notificationModel(
        notificationFactory.create({
          recipient: userId,
          sender: sender.id,
          status: Notification_Status.Read,
        })
      ),
    ];
    await notificationModel.create(notifications);

    // Act
    const response = await request(app)
      .get('/api/v1/notifications')
      .query({ limit: 10, before: notifications[1].id })
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Notifications are fetched successfully');
    expect(response.body.results).toBe(1);
    expect(response.body.data.notifications).toHaveLength(1);
    expect(response.body.data.notifications[0]).toMatchObject({
      recipient: userId,
      sender: mapPopulatedUser(sender),
      status: Notification_Status.Unread,
    });
    expect(authMiddleware.protect).toHaveBeenCalled();
  });

  test('should return empty array if no notifications found', async () => {
    // Act
    const response = await request(app)
      .get('/api/v1/notifications')
      .query({ limit: 10 })
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Notifications are fetched successfully');
    expect(response.body.results).toBe(0);
    expect(response.body.data.notifications).toEqual([]);
    expect(authMiddleware.protect).toHaveBeenCalled();
  });
});
