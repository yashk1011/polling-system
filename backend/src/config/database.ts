import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/polling-system';

    await mongoose.connect(mongoUri);

    console.log('MongoDB connection established');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Continuing to run server without an active database connection');
  }
};


mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB driver reported an error:', err);
});
