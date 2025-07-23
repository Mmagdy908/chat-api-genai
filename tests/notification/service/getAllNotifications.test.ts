import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import {
  getAllByChat,
  getUnreadNotificationsCount,
} from '../../../src/services/notificationService';
import * as notificationRepository from '../../../src/repositories/notificationRepository';
import notificationModel from '../../../src/models/notification';
import { notificationFactory } from '../../utils/notificationFactory';
import { GetNotificationResponse } from '../../../src/schemas/notificationSchemas';

jest.mock('../../../src/repositories/notificationRepository');

describe('notificationService - getAllByChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch all notifications for a user', async () => {
    // Arrange
    const userId = 'user-id';
    const notifications = [
      new notificationModel(notificationFactory.create()),
      new notificationModel(notificationFactory.create()),
    ] as GetNotificationResponse[];
    jest.mocked(notificationRepository.getAll).mockResolvedValue(notifications);

    // Act
    const result = await getAllByChat(userId, '10', 'notif3');

    // Assert
    expect(notificationRepository.getAll).toHaveBeenCalledWith(userId, '10', 'notif3');
    expect(result).toEqual(notifications);
  });

  test('should return empty array if no notifications found', async () => {
    // Arrange
    const userId = 'user-id';
    jest.mocked(notificationRepository.getAll).mockResolvedValue([]);

    // Act
    const result = await getAllByChat(userId, '10', undefined);

    // Assert
    expect(notificationRepository.getAll).toHaveBeenCalledWith(userId, '10', undefined);
    expect(result).toEqual([]);
  });
});
