import { Request, Response, NextFunction } from 'express';
import { AppError, handleError } from '../../util/appError';
import ENV_VAR from '../../config/envConfig';

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
  const error = handleError(err);

  if (ENV_VAR.NODE_ENV === 'development') sendDevError(error, res);
  else {
    sendProdError(error, res);
  }
};
