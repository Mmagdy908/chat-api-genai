import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();
const envSchema = z.object({
  PROCESS_ID: z.number().optional(),
  NODE_ENV: z.string().regex(/\b(development|production|test)\b/),
  PORT: z.number(),

  DB: z.string().url().startsWith('mongodb'),
  DB_PASSWORD: z.string().min(1),

  SALT: z.number(),
  JWT_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  JWT_COOKIE_EXPIRES_IN: z.string(),
  PASSWORD_RESET_OTP_EXPIRES_AT: z.string(),

  EMAIL_HOST: z.string(),
  EMAIL_PORT: z.number(),
  EMAIL_USERNAME: z.string(),
  EMAIL_PASSWORD: z.string(),

  SENDGRID_USERNAME: z.string(),
  SENDGRID_PASSWORD: z.string(),

  BASE_URL: z.string().url(),

  REDIS_USERNAME: z.string(),
  REDIS_PASSWORD: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.number(),

  SOCKET_GRACE_PERIOD: z.number(),
  HEARTBEAT_KEY_EXPIRES_IN: z.number(),

  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_CLOUD_API_KEY: z.string(),
  CLOUDINARY_CLOUD_API_SECRET: z.string(),

  GEMINI_API_KEY: z.string(),
  GENAI_MODEL: z.string(),
});

export default envSchema.parse({
  PROCESS_ID: parseInt(process.env.pm_id as string) || 0,
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT as string),

  DB: process.env.DB,
  DB_PASSWORD: process.env.DB_PASSWORD,

  SALT: parseInt(process.env.SALT as string),
  JWT_SECRET: process.env.JWT_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
  JWT_COOKIE_EXPIRES_IN: process.env.JWT_COOKIE_EXPIRES_IN,
  PASSWORD_RESET_OTP_EXPIRES_AT: process.env.PASSWORD_RESET_OTP_EXPIRES_AT,

  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT as string),
  EMAIL_USERNAME: process.env.EMAIL_USERNAME,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,

  SENDGRID_USERNAME: process.env.SENDGRID_USERNAME,
  SENDGRID_PASSWORD: process.env.SENDGRID_PASSWORD,

  BASE_URL: process.env.BASE_URL,

  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: parseInt(process.env.REDIS_PORT as string),

  SOCKET_GRACE_PERIOD: parseInt(process.env.SOCKET_GRACE_PERIOD as string),
  HEARTBEAT_KEY_EXPIRES_IN: parseInt(process.env.HEARTBEAT_KEY_EXPIRES_IN as string),

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_CLOUD_API_KEY: process.env.CLOUDINARY_CLOUD_API_KEY,
  CLOUDINARY_CLOUD_API_SECRET: process.env.CLOUDINARY_CLOUD_API_SECRET,

  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GENAI_MODEL: process.env.GENAI_MODEL,
});
