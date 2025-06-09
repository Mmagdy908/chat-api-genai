import { Workspace } from './workspace';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password: string;
  passwordUpdatedAt: Date;
  workspaces: Workspace[] | string[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  checkPassword: (password: string) => Promise<boolean>;
}
