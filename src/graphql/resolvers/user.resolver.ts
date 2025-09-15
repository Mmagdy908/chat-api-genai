import { TArg, TContext, TObj } from '../../types/graphql.types';
import * as userService from '../../services/userService';
import * as userSchema from '../../schemas/userSchemas';
import { User } from '../../interfaces/models/user';

export default {
  Query: {
    user: async (_: TObj, args: TArg) => {
      const user = await userService.getUser(args.id);
      return userSchema.mapGetResponse(user as User);
    },
    searchedUsers: async (_: TObj, args: TArg) => {
      const users = await userService.searchByUsername(args.username);
      return users.map((user: User) => userSchema.mapGetResponse(user));
    },
  },
};
