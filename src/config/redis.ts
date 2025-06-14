import { createClient } from 'redis';
import ENV_VAR from './envConfig';

const client = createClient({
  username: ENV_VAR.REDIS_USERNAME,
  password: ENV_VAR.REDIS_PASSWORD,
  socket: {
    host: ENV_VAR.REDIS_HOST as string,
    port: ENV_VAR.REDIS_PORT,
  },
});

client.on('error', (err) => console.log('Redis Client Error', err));

export const redisConfig = async () => {
  try {
    await client.connect();

    console.log('Connected successfully to Redis');
  } catch (error) {
    console.log('Redis Client Error', error);
  }
};

export const disconnectRedis = async () => {
  try {
    await client.close();
    console.log('Redis is disconnected successfully ');
  } catch (error) {
    console.log('Redis Client Disconnection Error', error);
  }
};

export default client;
