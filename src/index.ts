import app from './app';
import { createLogger } from './utils/logger';

const logger = createLogger('Server');

// Get port from environment or use default
const port = Number(process.env.PORT) || 3000;

// Start the server
app
  .listen(port)
  .then(() => {
    logger.info(`🚀 NodeHub API is running at http://localhost:${port}`);
    logger.info(`📚 Swagger documentation available at http://localhost:${port}/swagger`);
  })
  .catch((error) => {
    logger.error('Failed to start server', { error });
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});
