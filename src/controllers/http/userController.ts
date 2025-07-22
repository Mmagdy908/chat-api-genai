import { NextFunction, Request, Response } from 'express';
import * as userService from '../../services/userService';
import * as userSchema from '../../schemas/userSchemas';
import catchAsync from '../../util/catchAsync';
import { User } from '../../interfaces/models/user';

export const getUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = await userService.getUser(req.params.id);

  res.status(200).json({
    status: 'success',
    data: { user: userSchema.mapGetResponse(user as User) },
    message: 'User is fetched successfully',
  });
});

export const searchByUsername = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await userService.searchByUsername(req.params.username);

    res.status(200).json({
      status: 'success',
      data: { users: users.map((user: User) => userSchema.mapGetResponse(user)) },
      results: users.length,
      message: 'Users fetched successfully',
    });
  }
);

export const updateMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (req.file) req.body.photo = req.url;

  const body = userSchema.mapUpdateMeRequest(req.body);

  const updatedUser = await userService.updateMe(req.user.id, body);

  res.status(200).json({
    status: 'success',
    data: { user: userSchema.mapUpdateMeResponse(updatedUser as User) },
    message: 'User updated successfully',
  });
});
