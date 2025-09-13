import { expressMiddleware, ExpressContextFunctionArgument } from '@as-integrations/express5';
import { ApolloServer } from '@apollo/server';
import { GraphQLError } from 'graphql';
import * as authService from '../services/authService';
import { captureStackTrace } from 'zod/dist/types/v4/core/util';

export const graphqlExpressMiddleware = (apolloServer: ApolloServer) =>
  expressMiddleware(apolloServer, {
    context: async ({ req }) => {
      try {
        const user = await authService.isUserLoggedIn(req.headers.authorization);
        return { user };
      } catch (error: any) {
        return {
          authError: new GraphQLError(error.message, {
            extensions: {
              code: 'UNAUTHENTICATED',
              http: { status: error.statusCode },
            },
          }),
        };
      }
    },
  });
