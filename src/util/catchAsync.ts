import { Request, Response, NextFunction, RequestHandler } from 'express';

export default (fn: Function): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
