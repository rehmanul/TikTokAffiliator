import { config } from 'dotenv';
// Load environment variables before any other imports
config();

import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes';
import { storage } from './storage/storage-impl';
import { CONFIG } from './config';

async function main() {
  // Create Express app
  const app = express();

  // Middleware
  app.use(cors({
    origin: CONFIG.CORS_ORIGIN
  }));
  app.use(express.json());

  // Register routes
  const server = await registerRoutes(app);

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
}

main().catch(error => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
