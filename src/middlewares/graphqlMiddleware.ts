import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServer } from '@apollo/server';

export const graphqlExpressMiddleware = (apolloServer: ApolloServer) =>
  expressMiddleware(apolloServer, {
    context: async ({ req }) => ({ token: req.headers.token }),
  });
