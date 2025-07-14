import { jest, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { setupIntegrationTests } from '../../utils/setup';
import userModel from '../../../src/models/user';
import { setupUser } from '../../utils/userFactory';
import { UpdateMeRequest } from '../../../src/schemas/userSchemas';

jest.mock('../../../src/middlewares/uploadMiddleware');

describe('POST /update-me', () => {
  setupIntegrationTests();

  test('should update user data successfully', async () => {
    // Arrange
    const { user, accessToken } = await setupUser({ isVerified: true });
    const updateData: Partial<UpdateMeRequest> = {
      firstName: 'Updated Name',
      photo: 'https://example.com/photo.jpg',
    };

    // Mock upload middleware
    jest
      .spyOn(require('../../../src/middlewares/uploadMiddleware'), 'uploadPhoto')
      .mockImplementation((req: any, res: any, next: any) => {
        req.file = { path: 'temp/photo.jpg' };
        next();
      });
    jest
      .spyOn(require('../../../src/middlewares/uploadMiddleware'), 'uploadToCloud')
      .mockImplementation((req: any, res: any, next: any) => {
        req.url = 'https://example.com/photo.jpg';
        next();
      });

    // Act
    const response = await request(app)
      .post('/api/v1/users/update-me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData)
      .expect(200);

    // Assert
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('User updated successfully');
    expect(response.body.data.user.firstName).toBe(updateData.firstName);
    expect(response.body.data.user.photo).toBe(updateData.photo);

    // Verify database update
    const updatedUser = await userModel.findById(user.id);
    expect(updatedUser?.firstName).toBe(updateData.firstName);
    expect(updatedUser?.photo).toBe(updateData.photo);
  });

  test('should return 401 for unauthorized request', async () => {
    // Arrange
    const updateData = { name: 'Updated Name' };

    // Act
    const response = await request(app)
      .post('/api/v1/users/update-me')
      .send(updateData)
      .expect(401);

    // Assert
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toContain('You are not logged in');
  });
});
