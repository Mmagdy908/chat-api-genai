import { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql';
import { TArg, TContext, TObj } from '../../types/graphql.types';

export const isLoggedIn =
  (resolver: GraphQLFieldResolver<TObj, TContext>) =>
  async (obj: TObj, args: TArg, context: TContext, info: GraphQLResolveInfo) => {
    if (!context.user) throw context.authError;

    return await resolver(obj, args, context, info);
  };
