import { Chat_Type } from '../../src/enums/chatEnums';

export interface MockChat {
  metaData?: {
    name?: string;
    description?: string;
    image?: string;
  };
  type?: Chat_Type;
  members?: string[];
}

class ChatFactory {
  private defaultChat: MockChat = {
    members: ['685c46356a5d7ff0af63af79', '685c46356a5d7ff0af63af79'],
    type: Chat_Type.Private,
  };

  create(overrides: MockChat = {}): MockChat {
    return { ...this.defaultChat, ...overrides };
  }

  createWithMissingFields(...fieldsToOmit: (keyof MockChat)[]): MockChat {
    const chat = { ...this.defaultChat };
    fieldsToOmit.forEach((field) => delete chat[field]);
    return chat;
  }
}

export const chatFactory = new ChatFactory();
