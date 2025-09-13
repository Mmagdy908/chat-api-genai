import { TArg, TContext, TObj } from '../../types/graphql.types';

export default {
  Query: {
    user: (_: TObj, args: TArg, context: TContext) => {
      if (!context.user) throw context.authError;
      return { name: 'testuser' };
    },
  },
};
