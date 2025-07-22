import { Types } from 'mongoose';
import { z } from 'zod/v4';
import { User } from '../interfaces/models/user';

const updateMeRequestSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photo: z.url().optional(),
});

const updateMeResponseSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  }),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  username: z.string(),
  email: z.email(),
  photo: z.url().optional(),
});

export type UpdateMeRequest = z.infer<typeof updateMeRequestSchema>;
export type UpdateMeResponse = z.infer<typeof updateMeResponseSchema>;
export type GetUserResponse = UpdateMeResponse;

export const mapUpdateMeRequest = (userData: UpdateMeRequest) =>
  updateMeRequestSchema.parse(userData);

export const mapUpdateMeResponse = (userData: User): UpdateMeResponse =>
  updateMeResponseSchema.parse({
    id: userData.id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    fullName: userData.fullName,
    username: userData.username,
    email: userData.email,
    photo: userData.photo,
  });

export const mapGetResponse = mapUpdateMeResponse;
