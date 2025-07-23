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

jest.mock('../../../src/middlewares/authMiddleware');

describe('GET /api/v1/notifications/unread-notifications-count', () => {
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

  test('should fetch unread notifications count', async () => {
    // Arrange
    const sender = await userModel.create(
      userFactory.create({ email: 'sender@example.con', username: 'sender', isVerified: true })
    );
    const notifications = [
      notificationFactory.create({
        recipient: userId,
        sender: sender.id,
        status: Notification_Status.Unread,
      }),
      notificationFactory.create({
        recipient: userId,
        sender: sender.id,
        status: Notification_Status.Unread,
      }),
    ];
    await notificationModel.create(notifications);

    // Act
    const response = await request(app)
      .get('/api/v1/notifications/unread-notifications-count')
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Unread notifications count is fetched successfully');
    expect(response.body.data.count).toBe(2);
    expect(authMiddleware.protect).toHaveBeenCalled();
  });

  test('should return 0 if no unread notifications', async () => {
    // Arrange
    const sender = await userModel.create(
      userFactory.create({ email: 'sender@example.con', username: 'sender', isVerified: true })
    );
    await notificationModel.create(
      notificationFactory.create({
        recipient: userId,
        sender: sender.id,
        status: Notification_Status.Read,
      })
    );

    // Act
    const response = await request(app)
      .get('/api/v1/notifications/unread-notifications-count')
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Unread notifications count is fetched successfully');
    expect(response.body.data.count).toBe(0);
    expect(authMiddleware.protect).toHaveBeenCalled();
  });
});
