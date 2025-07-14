import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import ENV_VAR from './config/envConfig';
import authRouter from './routes/authRoutes';
import friendshipRouter from './routes/friendshipRoutes';
import userRouter from './routes/userRoutes';
import globalErrorHandler from './controllers/http/errorController';
import { AppError } from './util/appError';
import { generateRefreshToken } from './util/authUtil';

const app = express();

// body -parser
app.use(express.json());

// cookie parser
app.use(cookieParser());

//development loggings
if (ENV_VAR.NODE_ENV === 'development') app.use(morgan('dev'));

// routers
app.use('/api/v1', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/friendships', friendshipRouter);
// app.use('/api/v1/tasks', taskRouter);
// app.use('/api/v1/workspaces', workspaceRouter);

//route not found
app.use('/{*splat}', (req, res, next) => {
  next(new AppError(404, `can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

export default app;
