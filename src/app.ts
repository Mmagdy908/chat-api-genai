import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dbConfig from './config/db';
import authRouter from './routes/authRoutes';
import globalErrorHandler from './controllers/errorController';
import AppError from './util/appError';

dotenv.config();

dbConfig();

const app = express();

// body -parser
app.use(express.json());

app.use(cookieParser());

//development loggings
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// routers
app.use('/api/v1', authRouter);
// app.use('/api/v1/tasks', taskRouter);
// app.use('/api/v1/workspaces', workspaceRouter);

//route not found
app.use('/{*any}', (req, res, next) => {
  next(new AppError(404, `can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
