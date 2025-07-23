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

describe('notificationService - getUnreadNotificationsCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return count of unread notifications', async () => {
    // Arrange
    const userId = 'user-id';
    const count = 3;
    jest.mocked(notificationRepository.getUnreadNotificationsCount).mockResolvedValue(count);

    // Act
    const result = await getUnreadNotificationsCount(userId);

    // Assert
    expect(notificationRepository.getUnreadNotificationsCount).toHaveBeenCalledWith(userId);
    expect(result).toEqual(count);
  });

  test('should return 0 if no unread notifications', async () => {
    // Arrange
    const userId = 'user-id';
    jest.mocked(notificationRepository.getUnreadNotificationsCount).mockResolvedValue(0);

    // Act
    const result = await getUnreadNotificationsCount(userId);

    // Assert
    expect(notificationRepository.getUnreadNotificationsCount).toHaveBeenCalledWith(userId);
    expect(result).toEqual(0);
  });
});
