import mongoose from 'mongoose';

export default async () => {
  try {
    const DB = process.env.DB?.replace('<db_password>', process.env.DB_PASSWORD || '');

    await mongoose.connect(DB || '');

    console.log('Connected successfully to MongoDB');
  } catch (err) {
    console.log('Failed to connect to MongoDB', err);
  }
};
