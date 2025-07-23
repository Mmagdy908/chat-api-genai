import { User } from '../../src/interfaces/models/user';

export const mapPopulatedUser = (user: User) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  photo: user.photo,
});
