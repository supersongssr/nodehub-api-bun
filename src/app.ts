import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { hostRoutes } from './modules/host/routes';
import { nodeRoutes } from './modules/node/routes';
import { configRoutes } from './modules/config/routes';

/**
 * Main Elysia application
 * Sets up the API server with Swagger documentation
 */

const app = new Elysia({
  name: 'NodeHub API',
})
  // Add Swagger documentation
  .use(
    swagger({
      documentation: {
        info: {
          title: 'NodeHub API',
          version: '1.0.0',
          description: 'Centralized node management service for VPS nodes and frontend panels',
        },
        tags: [
          { name: 'Health', description: 'Health check endpoints' },
          { name: 'Host', description: 'VPS host management' },
          { name: 'Node', description: 'Proxy node management' },
          { name: 'Config', description: 'Configuration distribution' },
        ],
      },
      path: '/swagger',
    })
  )
  // Register module routes
  .use(hostRoutes)
  .use(nodeRoutes)
  .use(configRoutes)
  // Health check endpoint
  .get(
    '/health',
    () => ({
      success: true,
      data: {
        status: 'healthy',
        timestamp: Date.now(),
        version: '1.0.0',
      },
      error: null,
    }),
    {
      detail: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check if the API is running',
      },
    }
  )
  // Root endpoint
  .get(
    '/',
    () => ({
      success: true,
      data: {
        message: 'NodeHub API - Centralized node management service',
        version: '1.0.0',
        documentation: '/swagger',
      },
      error: null,
    }),
    {
      detail: {
        tags: ['Health'],
        summary: 'API information',
        description: 'Get basic API information',
      },
    }
  );

export default app;
