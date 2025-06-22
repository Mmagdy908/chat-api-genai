import { User } from '../interfaces/models/user';
import { RegisterRequest, LoginRequest } from '../interfaces/requests/user';
import { RegisterResponse, LoginResponse } from '../interfaces/responses/user';

export const mapRegisterRequest = (userData: User): RegisterRequest => {
  const { firstName, lastName, username, email, password } = userData;

  return { firstName, lastName, username, email, password };
};

export const mapRegisterResponse = (userData: User): RegisterResponse => {
  const { id, firstName, lastName, username, fullName, email, createdAt } = userData;

  return { id, firstName, lastName, username, fullName, email, createdAt };
};

export const mapLoginRequest = (userData: User): LoginRequest => {
  const { email, password } = userData;

  return { email, password };
};

export const mapLoginResponse = (
  userData: User,
  accessToken: string,
  refreshToken: string
): LoginResponse => {
  const { id, firstName, lastName, username, fullName, email, createdAt } = userData;
  // const workspaces = userData.workspaces as Workspace[];
  return {
    id,
    firstName,
    lastName,
    fullName,
    username,
    email,
    // workspaces: workspaces.map((workspace) =>
    //   workspaceMapper.mapCreateWorkspaceResponse(workspace)
    // ),

    accessToken,
    refreshToken,
    createdAt,
  };
};

export const mapUpdateUserResponse = mapLoginResponse;
// export const mapRefreshTokenRequest = (userData: {
//   userId: string;
//   refreshToken: string;
// }): RefreshTokenRequest => {
//   const { userId, refreshToken } = userData;
//   return { userId, refreshToken };
// };
