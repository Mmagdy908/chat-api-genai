import { Schema } from 'mongoose';

export const toObjectId = (id: string): Schema.Types.ObjectId => new Schema.Types.ObjectId(id);
