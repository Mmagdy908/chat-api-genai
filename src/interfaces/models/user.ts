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
  photo: string;
  createdAt: Date;
  updatedAt: Date;
  checkPassword: (password: string) => Promise<boolean>;
}
