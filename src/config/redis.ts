import { createClient } from 'redis';

const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST as string,
    port: parseInt(process.env.REDIS_PORT as string),
  },
});

(async () => {
  try {
    client.on('error', (err) => console.log('Redis Client Error', err));

    await client.connect();

    console.log('Connected successfully to Redis');
  } catch (error) {
    console.log('Redis Client Error', error);
  }
})();

export default client;
