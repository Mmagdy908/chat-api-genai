import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { mongoConfig } from './config/mongo';
import { redisConfig, clearRedis, pubClient, subClient } from './config/redis';
import app from './app';
import { setupSocket } from './socket/socket';
import ENV_VAR from './config/envConfig';

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

mongoConfig();
redisConfig();

const httpServer = createServer(app);
const port = ENV_VAR.PORT || 3000;

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
