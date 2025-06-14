import mongoose from 'mongoose';
import ENV_VAR from './envConfig';

export const mongoConfig = async () => {
  try {
    const DB = ENV_VAR.DB?.replace('<db_password>', ENV_VAR.DB_PASSWORD as string);

    await mongoose.connect(DB as string);

    console.log('Connected successfully to MongoDB');
  } catch (err) {
    console.log('Failed to connect to MongoDB', err);
  }
};

export const clearMongoDB = async () => {
  try {
    const models = await mongoose.connection.db?.listCollections().toArray();
    models?.forEach(async (model) => {
      await mongoose.connection.db?.collection(model.name).deleteMany();
    });
    console.log('MongoDB is cleared successfully');
  } catch (err) {
    console.log('Failed to clear MongoDB', err);
  }
};

export const disconnectMongoDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB is disconnected successfully');
  } catch (err) {
    console.log('Failed to disconnect MongoDB', err);
  }
};
