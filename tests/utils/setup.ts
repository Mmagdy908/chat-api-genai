import { jest, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { mongoConfig, disconnectMongoDB, clearMongoDB } from '../../src/config/mongo';
import { redisConfig, disconnectRedis, clearRedis } from '../../src/config/redis';

export const setupIntegrationTests = () => {
  beforeAll(async () => {
    await mongoConfig(); // Start in-memory MongoDB
    await redisConfig();
  });

  beforeEach(async () => {
    await clearMongoDB(); // Reset database
    await clearRedis();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await disconnectMongoDB(); // Stop MongoDB
    await disconnectRedis();
  });
};
