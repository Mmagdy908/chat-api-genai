export interface RegisterResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  createdAt: Date;
}

export interface LoginResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  // workspaces: Partial<Workspace>[] | string[];
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
}
