import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './graphql/schemas/index.ts';
import { resolvers } from './graphql/resolvers/index.ts';
import { TContext } from './types/graphql.types';

import { mongoConfig } from './config/mongo';
import { redisConfig, clearRedis, pubClient, subClient } from './config/redis';
import app, { configureApp } from './app';
import { setupSocket } from './socket/socket';
import ENV_VAR from './config/envConfig';

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

mongoConfig();
redisConfig();

async function startServer() {
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    path: '/api/v1/socket.io/',
    cors: {
      origin: '*', // Adjust for production (e.g., specific frontend URL)
      methods: ['GET', 'POST'],
    },
    adapter: createAdapter(pubClient, subClient),
  });

  // Initialize Socket.IO event handlers
  setupSocket(io);

  // setting up graphql
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const apolloServer = new ApolloServer<TContext>({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await apolloServer.start();

  configureApp(apolloServer);

  const port = ENV_VAR.PORT || 3000;

  httpServer.listen(port, () => console.log(`Server is running on port ${port}`));

  process.on('SIGTERM', async () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    await clearRedis();
    httpServer.close(() => {
      console.log('💥 Process terminated!');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    await clearRedis();
    httpServer.close(() => {
      console.log('💥 Process terminated!');
      process.exit(0);
    });
  });

  process.on('SIGUSR2', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    httpServer.close(() => {
      console.log('💥 Process terminated!');
      process.exit(0);
    });
  });

  process.on('unhandledRejection', (err: any) => {
    console.log(err.name, err.message);
    httpServer.close(() => process.exit(1));
  });
}

startServer();
