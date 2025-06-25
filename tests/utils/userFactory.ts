import { User_Status } from '../../src/enums/userEnums';
import userModel from '../../src/models/user';
import * as authUtil from '../../src/util/authUtil';

export interface MockUser {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  isVerified?: boolean;
  status?: User_Status;
  passwordUpdatedAt?: Date;
}

class UserFactory {
  private defaultUser: MockUser = {
    firstName: 'Ahmed',
    lastName: 'Essam',
    username: 'ahmedessam',
    email: 'ahmedessam@example.com',
    password: 'pass1234',
    isVerified: false,
  };

  create(overrides: MockUser = {}): MockUser {
    return { ...this.defaultUser, ...overrides };
  }

  createWithMissingFields(...fieldsToOmit: (keyof MockUser)[]): MockUser {
    const user = { ...this.defaultUser };
    fieldsToOmit.forEach((field) => delete user[field]);
    return user;
  }
}

export const userFactory = new UserFactory();

export const setupUser = async (overrides: MockUser = {}) => {
  const userData = userFactory.create({ isVerified: true, ...overrides });
  const user = await userModel.create(userData);
  const { accessToken, refreshToken } = await authUtil.login(user.id);
  return { user, accessToken, userData, refreshToken };
};
