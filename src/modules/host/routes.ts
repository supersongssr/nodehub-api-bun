/**
 * Host module routes
 * API endpoints for host management
 */

import { Elysia, t } from 'elysia';
import { successResponse, errorResponse, ErrorCodes } from '@/utils/response';
import {
  getAllHosts,
  getHostById,
  createHost,
  updateHost,
  deleteHost,
  processHeartbeat,
  getHostStats,
} from './service';
import type { HostInfo, HostUpdate, HostHeartbeat } from './model';

export const hostRoutes = new Elysia({ prefix: '/hosts' })
  // Get all hosts
  .get('/', async () => {
    try {
      const hosts = await getAllHosts();
      return successResponse(hosts);
    } catch (error) {
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to get hosts',
        error
      );
    }
  }, {
    detail: {
      tags: ['Host'],
      summary: 'Get all hosts',
      description: 'Retrieve all VPS hosts',
    },
  })
  // Get host by ID
  .get('/:id', async ({ params }) => {
    try {
      const host = await getHostById(Number(params.id));
      if (!host) {
        return errorResponse(ErrorCodes.HOST_NOT_FOUND, `Host with ID ${params.id} not found`);
      }
      return successResponse(host);
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get host', error);
    }
  }, {
    detail: {
      tags: ['Host'],
      summary: 'Get host by ID',
      description: 'Retrieve a specific VPS host by ID',
    },
  })
  // Create new host
  .post('/', async ({ body }) => {
    try {
      const hostInfo = body as HostInfo;
      const host = await createHost(hostInfo);
      return successResponse(host);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return errorResponse(ErrorCodes.HOST_ALREADY_EXISTS, error.message);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create host', error);
    }
  }, {
    detail: {
      tags: ['Host'],
      summary: 'Create new host',
      description: 'Register a new VPS host',
    },
    body: t.Object({
      name: t.String(),
      ip: t.String(),
      ipv6: t.Optional(t.String()),
      cpuCores: t.Number(),
      cpuUsage: t.Optional(t.Number()),
      memoryTotal: t.Number(),
      memoryUsed: t.Optional(t.Number()),
      diskTotal: t.Number(),
      diskUsed: t.Optional(t.Number()),
      uploadTotal: t.Optional(t.Integer()),
      downloadTotal: t.Optional(t.Integer()),
      lastNetworkReset: t.Optional(t.Integer()),
      region: t.Optional(t.String()),
      city: t.Optional(t.String()),
      isp: t.Optional(t.String()),
      status: t.Optional(t.String()),
      uptime: t.Optional(t.Integer()),
      lastHeartbeat: t.Optional(t.Integer()),
    }),
  })
  // Update host
  .patch('/:id', async ({ params, body }) => {
    try {
      const update = body as Partial<HostUpdate>;
      const host = await updateHost(Number(params.id), update);
      if (!host) {
        return errorResponse(ErrorCodes.HOST_NOT_FOUND, `Host with ID ${params.id} not found`);
      }
      return successResponse(host);
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update host', error);
    }
  }, {
    detail: {
      tags: ['Host'],
      summary: 'Update host',
      description: 'Update host information',
    },
    body: t.Object({
      cpuUsage: t.Optional(t.Number()),
      memoryUsed: t.Optional(t.Number()),
      diskUsed: t.Optional(t.Number()),
      uploadTotal: t.Optional(t.Integer()),
      downloadTotal: t.Optional(t.Integer()),
      status: t.Optional(t.String()),
      uptime: t.Optional(t.Integer()),
      lastHeartbeat: t.Optional(t.Integer()),
    }),
  })
  // Delete host
  .delete('/:id', async ({ params }) => {
    try {
      const deleted = await deleteHost(Number(params.id));
      if (!deleted) {
        return errorResponse(ErrorCodes.HOST_NOT_FOUND, `Host with ID ${params.id} not found`);
      }
      return successResponse({ message: 'Host deleted successfully' });
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete host', error);
    }
  }, {
    detail: {
      tags: ['Host'],
      summary: 'Delete host',
      description: 'Delete a host',
    },
  })
  // Heartbeat endpoint (called by VPS nodes)
  .post('/heartbeat', async ({ body }) => {
    try {
      const heartbeat = body as HostHeartbeat;
      const host = await processHeartbeat(heartbeat);
      return successResponse(host);
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to process heartbeat', error);
    }
  }, {
    detail: {
      tags: ['Host'],
      summary: 'Host heartbeat',
      description: 'Called by VPS nodes to report their status',
    },
    body: t.Object({
      name: t.String(),
      cpuUsage: t.Number(),
      memoryUsed: t.Integer(),
      diskUsed: t.Integer(),
      uploadTotal: t.Integer(),
      downloadTotal: t.Integer(),
      uptime: t.Integer(),
      timestamp: t.Integer(),
    }),
  })
  // Get host statistics
  .get('/stats/summary', async () => {
    try {
      const stats = await getHostStats();
      return successResponse(stats);
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get host stats', error);
    }
  }, {
    detail: {
      tags: ['Host'],
      summary: 'Get host statistics',
      description: 'Get aggregate statistics about all hosts',
    },
  });
