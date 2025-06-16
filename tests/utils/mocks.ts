import { Response } from 'express';
import * as userMapper from '../../src/mappers/userMapper';
import { User } from '../../src/interfaces/models/user';

export const mockedSendLoginResponseImplementation = (
  res: Response,
  loggedUserData: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }
) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: userMapper.mapLoginResponse(
        loggedUserData.user,
        loggedUserData.accessToken,
        loggedUserData.refreshToken
      ),
    },
  });
};
