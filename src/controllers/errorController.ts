import { Request, Response, NextFunction } from 'express';
import AppError from '../util/appError';

const sendDevError = (err: any, res: Response) => {
  res
    .status(err.statusCode)
    .json({ status: err.status, error: err, message: err.message, stack: err.stack });
};

const sendProdError = (err: AppError, res: Response) => {
  if (err.isOperational)
    res.status(err.statusCode).json({ status: err.status, message: err.message });
  else {
    console.log('Error: ', err);
    res.status(500).json({
      status: 'error',
      message: 'something went wrong',
    });
  }
};

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  err.status ??= 'error';
  err.statusCode ??= 500;

  let error = err;

  if (err.cause?.code === 11000) error = new AppError(400, err.message);
  else if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors)
      .map((e: any) => e.message)
      .join(' & ');
    error = new AppError(400, msg);
  } else if (err.name === 'JsonWebTokenError') error = new AppError(401, 'Invalid Access Token');
  else if (err.name === 'TokenExpiredError') error = new AppError(401, 'Expired Access Token');

  if (process.env.NODE_ENV === 'development') sendDevError(error, res);
  else {
    sendProdError(error, res);
  }
};
