import {
  Notification_Status,
  Notification_Type,
  Reference_Type,
} from '../../src/enums/notificationEnums';

export interface MockNotification {
  type?: Notification_Type;
  sender?: string;
  recipient?: string;
  reference?: string;
  referenceType?: string;
  status?: Notification_Status;
}

class NotificationFactory {
  private defaultNotification: MockNotification = {
    type: Notification_Type.Received_Friend_Request,
    sender: '687df740281a61ee825c3a8b',
    recipient: '687df740281a61ee825c3a8b',
    reference: '687df740281a61ee825c3a8b',
    referenceType: Reference_Type.Friendship,
    status: Notification_Status.Unread,
  };

  create(overrides: MockNotification = {}): MockNotification {
    return { ...this.defaultNotification, ...overrides };
  }

  createWithMissingFields(...fieldsToOmit: (keyof MockNotification)[]): MockNotification {
    const notification = { ...this.defaultNotification };
    fieldsToOmit.forEach((field) => delete notification[field]);
    return notification;
  }
}

export const notificationFactory = new NotificationFactory();
