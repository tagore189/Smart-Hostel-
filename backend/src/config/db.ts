import mongoose from 'mongoose';
import { env } from './env';

let mongodInstance: any = null;

export const connectDB = async (): Promise<string> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.host;
  }
  try {
    // Attempt connecting to the configured URI with a 3-second timeout
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[DB] Connected to MongoDB at ${env.MONGODB_URI}`);
    return env.MONGODB_URI;
  } catch (err: any) {
    console.warn(`[DB] Could not connect to primary MongoDB (${err.message}). Starting MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DB] Connected successfully to In-Memory MongoDB at ${memoryUri}`);
      return memoryUri;
    } catch (memErr: any) {
      console.error(`[DB] Critical: Failed to initialize in-memory database:`, memErr);
      throw memErr;
    }
  }
};

export const closeDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};
