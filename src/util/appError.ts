import { ZodError } from 'zod/v4';

export class AppError extends Error {
  status: string;
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const handleError = (err: any) => {
  err.status ??= 'error';
  err.statusCode ??= 500;

  let error = err;
  if (err.cause?.code === 11000) error = new AppError(400, err.message);
  else if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors)
      .map((e: any) => e.message)
      .join(' & ');
    error = new AppError(400, msg);
  } else if (err.name === 'JsonWebTokenError') error = new AppError(401, 'Invalid JWT Token');
  else if (err.name === 'TokenExpiredError') error = new AppError(401, 'Expired JWT Token');
  else if (err instanceof ZodError)
    error = new AppError(
      400,
      `(${JSON.parse(err.message)[0].path[0]}) ${JSON.parse(err.message)[0].message}`
    );

  return error;
};
