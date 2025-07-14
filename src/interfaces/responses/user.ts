export interface RegisterResponse {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  fullName: string;
  email: string;
  createdAt: Date;
}

export interface LoginResponse {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  fullName: string;
  email: string;
  photo: string;
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
}
