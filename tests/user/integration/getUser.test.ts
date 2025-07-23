import { jest, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import { userFactory } from '../../utils/userFactory';

describe('GET /users/:id', () => {
  setupIntegrationTests();

  test('should fetch user by id for existing verified user', async () => {
    // Arrange
    const userData = userFactory.create({ isVerified: true });
    const user = await userModel.create(userData);

    // Act
    const response = await request(app).get(`/api/v1/users/${user.id}`).expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('User is fetched successfully');
    expect(response.body.data.user).toMatchObject({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  });

  test('should return 404 for non-existent or unverified user', async () => {
    // Act
    const response = await request(app).get('/api/v1/users/687df740281a61ee825c3a8b').expect(404);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toBe('User not found');
  });
});
