import { jest, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import { userFactory } from '../../utils/userFactory';

describe('GET /users/search/:username', () => {
  setupIntegrationTests();

  test('should fetch users by username', async () => {
    // Arrange
    const username = 'testuser';
    const users = [
      userFactory.create({
        email: 'testuser1@example.com',
        username: 'testuser1',
        isVerified: true,
      }),
      userFactory.create({
        email: 'testuser2@example.com',
        username: 'testuser2',
        isVerified: true,
      }),
    ];
    await userModel.insertMany(users);

    // Act
    const response = await request(app).get(`/api/v1/users/search/${username}`).expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Users fetched successfully');
    expect(response.body.results).toBe(users.length);
    expect(response.body.data.users).toHaveLength(users.length);
    expect(response.body.data.users[0]).toMatchObject({
      username: users[0].username,
      email: users[0].email,
    });
  });

  test('should return empty array for no matching users', async () => {
    // Act
    const response = await request(app).get('/api/v1/users/search/nonexistent').expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Users fetched successfully');
    expect(response.body.results).toBe(0);
    expect(response.body.data.users).toEqual([]);
  });
});
