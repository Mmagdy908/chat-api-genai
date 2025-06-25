import { Friendship_Status } from '../../src/enums/friendshipEnums';

export interface MockFriendShip {
  sender?: string;
  recipient?: string;
  status?: Friendship_Status;
}

class FriendshipFactory {
  private defaultUser: MockFriendShip = {
    sender: '685c46356a5d7ff0af63af79',
    recipient: '685c46356a5d7ff0af63af79',
    status: Friendship_Status.Pending,
  };

  create(overrides: MockFriendShip = {}): MockFriendShip {
    return { ...this.defaultUser, ...overrides };
  }

  createWithMissingFields(...fieldsToOmit: (keyof MockFriendShip)[]): MockFriendShip {
    const user = { ...this.defaultUser };
    fieldsToOmit.forEach((field) => delete user[field]);
    return user;
  }
}

export const friendshipFactory = new FriendshipFactory();
