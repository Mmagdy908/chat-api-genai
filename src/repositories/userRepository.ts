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
  return await userModel.findOne({ email }).populate({ path: 'workspaces', select: 'title' });
};

export const updateById = async (id: string, newUserData: Partial<User>): Promise<User | null> => {
  return await userModel
    .findByIdAndUpdate(id, newUserData, { new: true })
    .populate({ path: 'workspaces', select: 'title' });
};

export const addWorkspace = async (id: string, workspaceId: string): Promise<User | null> => {
  return await userModel
    .findByIdAndUpdate(id, { $push: { workspaces: workspaceId } }, { new: true })
    .populate({ path: 'workspaces', select: 'title' });
};

export const removeWorkspace = async (id: string, workspaceId: string): Promise<User | null> => {
  return await userModel
    .findByIdAndUpdate(id, { $pull: { workspaces: workspaceId } }, { new: true })
    .populate({ path: 'workspaces', select: 'title' });
};

export const saveUser = async (user: User): Promise<void> => {
  const userDoc = new userModel(user);
  await userDoc.save();
};
