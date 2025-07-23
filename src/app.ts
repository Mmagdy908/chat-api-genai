import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitizer from 'express-mongo-sanitize';
import compression from 'compression';
import rateLimiter from 'express-rate-limit';
import ENV_VAR from './config/envConfig';
import authRouter from './routes/authRoutes';
import userRouter from './routes/userRoutes';
import friendshipRouter from './routes/friendshipRoutes';
import chatRouter from './routes/chatRoutes';
import notificationRouter from './routes/notificationRoutes';
import uploadRouter from './routes/uploadRoutes';
import globalErrorHandler from './controllers/http/errorController';
import { AppError } from './util/appError';

const app = express();
// MIDDLEWARES

// applying cors
app.use(cors());
// for non simple requests
app.options('/{*splat}', cors());

//set security http header
app.use(helmet());

// rate limiting
const limiter = rateLimiter({
  limit: 100, //customize according to your app
  windowMs: 60 * 60 * 1000,
  message: 'too many requests, please try again in an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

//body-parser to parse req.body
app.use(
  express.json({
    limit: '10kb',
  })
);

// compress text sent in responses
app.use(compression());

// body -parser
app.use(express.json());

// cookie parser
app.use(cookieParser());

//sanitize data against nosql injections
app.use(mongoSanitizer());

//prevent parameter pollution
app.use(hpp());

// trust proxy
app.set('trust proxy', 1);

//development loggings
if (ENV_VAR.NODE_ENV === 'development') app.use(morgan('dev'));

// routers
app.use('/api/v1', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/friendships', friendshipRouter);
app.use('/api/v1/chats', chatRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/uploads', uploadRouter);

//route not found
app.use('/{*splat}', (req, res, next) => {
  next(new AppError(404, `can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

export default app;
