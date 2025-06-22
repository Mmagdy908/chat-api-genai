import { User_Status } from '../../enums/userEnums';
import { Schema } from 'mongoose';
export interface User {
  id: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  passwordUpdatedAt: Date;
  isVerified: boolean;
  status: User_Status;
  createdAt: Date;
  updatedAt: Date;
  checkPassword: (password: string) => Promise<boolean>;
}
