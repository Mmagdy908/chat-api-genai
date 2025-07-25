import { createClient } from 'redis';
import ENV_VAR from './envConfig';

const client = createClient({
  username: ENV_VAR.REDIS_USERNAME,
  password: ENV_VAR.REDIS_PASSWORD,
  socket: {
    host: ENV_VAR.REDIS_HOST,
    port: ENV_VAR.REDIS_PORT,

    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 100, 3000);
      console.log(`Reconnecting attempt ${retries}, retrying in ${delay}ms`);
      return delay;
    },
  },
});

export const subscriber = client.duplicate();

export const pubClient = client.duplicate();
export const subClient = client.duplicate();

client.on('error', (err) => console.log('Redis Client Error', err));

export const redisConfig = async () => {
  try {
    await client.connect();
    await subscriber.connect();
    await pubClient.connect();
    await subClient.connect();

    client.configSet('notify-keyspace-events', 'Ex');

    console.log('Connected successfully to Redis');
  } catch (error) {
    console.log('Redis Client Error', error);
  }
};

export const clearRedis = async () => {
  try {
    await client.flushDb();
    console.log('Redis is cleared successfully');
  } catch (err) {
    console.log('Failed to clear Redis', err);
  }
};

export const disconnectRedis = async () => {
  try {
    await client.close();
    await subscriber.close();
    console.log('Redis is disconnected successfully ');
  } catch (error) {
    console.log('Redis Client Disconnection Error', error);
  }
};

export default client;
