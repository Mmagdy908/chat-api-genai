import { expressMiddleware, ExpressContextFunctionArgument } from '@as-integrations/express5';
import { ApolloServer } from '@apollo/server';
import { GraphQLError } from 'graphql';

export const graphqlExpressMiddleware = (apolloServer: ApolloServer) =>
  expressMiddleware(apolloServer, {
    context: async ({ req, res }) => {
      return { token: req.headers.token };
    },
  });
