import { NextFunction, Request, Response } from 'express';
import * as userService from '../../services/userService';
import * as userSchema from '../../schemas/userSchemas';
import catchAsync from '../../util/catchAsync';
import { User } from '../../interfaces/models/user';

export const updateMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (req.file) req.body.photo = req.url;

  const body = userSchema.mapToUpdateMeRequest(req.body);

  const updatedUser = await userService.updateMe(req.user.id, body);

  res.status(200).json({
    status: 'success',
    data: { user: userSchema.mapToUpdateMeResponse(updatedUser as User) },
    message: 'User updated successfully',
  });
});
