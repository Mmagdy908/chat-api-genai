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

export const clearMongoDB = async () => {
  try {
    console.log(await mongoose.connection.db?.collections());

    mongoose.modelNames().forEach(async (modelName) => {
      console.log(modelName);
      await mongoose.model(modelName).deleteMany();
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
