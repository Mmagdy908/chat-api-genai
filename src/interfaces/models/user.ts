import { User_Status } from '../../enums/userEnums';

export interface User {
  id: string;
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
