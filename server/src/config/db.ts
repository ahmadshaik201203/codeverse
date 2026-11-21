import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';

export type DbStatus = 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'unknown';

const STATUS_MAP: Record<number, DbStatus> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/** Local dev stand-in when the configured cluster is unreachable. */
const DEV_FALLBACK_URI = 'mongodb://127.0.0.1:27017/codeverse';

/**
 * Connects to MongoDB. Throws on failure so the entrypoint can exit instead of
 * serving requests with no database. In development an unreachable primary
 * (offline laptop, dead DNS) falls back to a local mongod instead of failing.
 */
export const connectDB = async (): Promise<void> => {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Non-fatal: some environments forbid changing DNS servers.
  }

  mongoose.set('strictQuery', true);

  const options = {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  };

  try {
    await mongoose.connect(env.mongoUri, options);
  } catch (error) {
    if (env.isProduction) throw error;

    console.warn(
      `[Database] Primary connection failed (${(error as Error).message}). ` +
        `Falling back to local ${DEV_FALLBACK_URI}`
    );
    await mongoose.connect(DEV_FALLBACK_URI, options);
  }

  console.log('[Database] MongoDB connection established.');
};

export const getDbStatus = (): DbStatus => STATUS_MAP[mongoose.connection.readyState] ?? 'unknown';

export const isDbConnected = (): boolean => mongoose.connection.readyState === 1;

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
};
