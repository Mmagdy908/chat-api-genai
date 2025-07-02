import { mongoConfig } from './config/mongo';
import { redisConfig } from './config/redis';
import app from './app';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './socket/socket';
import ENV_VAR from './config/envConfig';

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
});

// Initialize Socket.IO event handlers
setupSocket(io);

httpServer.listen(port, () => console.log(`Server is running on port ${port}`));
