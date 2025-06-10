export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password: string;
  passwordUpdatedAt: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  checkPassword: (password: string) => Promise<boolean>;
}
