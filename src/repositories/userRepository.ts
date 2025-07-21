import { PopulateOptions } from 'mongoose';
import { User } from '../interfaces/models/user';
import userModel from '../models/user';

export const create = async (userData: Partial<User>): Promise<User> => {
  return await userModel.create(userData);
};

export const getById = async (
  id: string,
  ...populateOptions: PopulateOptions[]
): Promise<User | null> => {
  const query = userModel.findById(id);
  populateOptions?.forEach((option) => query.populate(option));
  return await query;
};

export const getByEmail = async (email: string): Promise<User | null> => {
  return await userModel.findOne({ email });
};

export const updateById = async (id: string, newUserData: Partial<User>): Promise<User | null> => {
  return await userModel.findByIdAndUpdate(id, newUserData, { new: true });
};

export const saveUser = async (user: User): Promise<void> => {
  const userDoc = new userModel(user);
  await userDoc.save();
};
