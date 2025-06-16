import { jest, describe, expect, test, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { mongoConfig, disconnectMongoDB, clearMongoDB } from '../../src/config/mongo';
import { redisConfig, clearRedis, disconnectRedis } from '../../src/config/redis';

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
