import mongoose from 'mongoose';

export const mongoConfig = async () => {
  try {
    const DB = process.env.DB?.replace('<db_password>', process.env.DB_PASSWORD as string);

    await mongoose.connect(DB as string);

    console.log('Connected successfully to MongoDB');
  } catch (err) {
    console.log('Failed to connect to MongoDB', err);
  }
};
