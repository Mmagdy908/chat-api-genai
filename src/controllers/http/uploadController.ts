import { NextFunction, Request, Response } from 'express';
import catchAsync from '../../util/catchAsync';
import { AppError } from '../../util/appError';

export const uploadMedia = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.url) next(new AppError(400, 'Invalid file'));
  res.status(201).json({
    status: 'success',
    url: req.url,
    message: 'File is uploaded successfully',
  });
});
