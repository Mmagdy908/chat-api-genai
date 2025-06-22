import { Schema } from 'mongoose';

export interface RegisterResponse {
  id: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  fullName: string;
  email: string;
  createdAt: Date;
}

export interface LoginResponse {
  id: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  fullName: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
}
