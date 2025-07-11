import { Friendship_Status } from '../../src/enums/friendshipEnums';
import { Message_Status, Message_Type } from '../../src/enums/messageEnums';

export interface MockMessage {
  chat?: string;
  sender?: string;
  status?: Message_Status;
  content?: {
    contentType: Message_Type;
    text?: string;
    mediaUrl?: string;
  };
}

class MessageFactory {
  private defaultFriendship: MockMessage = {
    chat: '685c46356a5d7ff0af63af79',
    sender: '685c46356a5d7ff0af63af79',
    status: Message_Status.Sent,
    content: {
      contentType: Message_Type.Text,
      text: 'Hello',
    },
  };

  create(overrides: MockMessage = {}): MockMessage {
    return { ...this.defaultFriendship, ...overrides };
  }

  createWithMissingFields(...fieldsToOmit: (keyof MockMessage)[]): MockMessage {
    const message = { ...this.defaultFriendship };
    fieldsToOmit.forEach((field) => delete message[field]);
    return message;
  }
}

export const messageFactory = new MessageFactory();
