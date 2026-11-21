import { assertEnv, env } from './config/env';
import { connectDB } from './config/db';
import { createApp } from './app';

// Refuse to start without required configuration (names only, never values).
assertEnv();

const app = createApp();

const redact = (message: string): string =>
  message.replace(/mongodb(\+srv)?:\/\/[^@\s]*@/gi, 'mongodb://***@');

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`[CodeVerse Server] Listening on port ${env.port}`);
    console.log(`[CodeVerse Server] CORS allowlist: ${env.corsOrigins.join(', ')}`);
  });
};

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown startup error';
  console.error(`[Startup] Fatal: ${redact(message)}`);
  process.exit(1);
});

export { app };
