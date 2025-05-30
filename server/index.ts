import { config } from 'dotenv';
// Load environment variables before any other imports
config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { registerRoutes } from './routes';
import { storage } from './storage/storage-impl';
import { CONFIG, PATHS } from './config';
import { jsonErrorHandler } from './middleware/jsonErrorHandler';

async function main() {
  // Create Express app
  const app = express();

  // Middleware
  app.use(cors({
    origin: CONFIG.CORS_ORIGIN
  }));
  app.use(express.json());

  // Register API routes
  const server = await registerRoutes(app);

  // Error handling
  app.use(jsonErrorHandler);

  // Serve static frontend in production
  if (CONFIG.NODE_ENV === 'production') {
    app.use(express.static(PATHS.public));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(PATHS.public, 'index.html'));
    });
  }

  // Start server
  const port = CONFIG.PORT;
  server.listen(port, () => {
    console.log(`Server running on port ${port} in ${CONFIG.NODE_ENV} mode`);
    console.log(`CORS enabled for origin: ${CONFIG.CORS_ORIGIN}`);
  });

  // Handle cleanup on shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Cleaning up...');
    await storage.cleanup();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT. Cleaning up...');
    await storage.cleanup();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  // Log unhandled promise rejections to avoid silent crashes
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });
}

main().catch(error => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
