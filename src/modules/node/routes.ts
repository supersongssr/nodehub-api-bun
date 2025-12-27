/**
 * Node module routes
 * API endpoints for node management
 */

import { Elysia, t } from 'elysia';
import { successResponse, errorResponse, ErrorCodes } from '@/utils/response';
import {
  getAllNodes,
  getNodeById,
  getNodesByPanel,
  createNode,
  updateNode,
  deleteNode,
  getNodeStats,
  linkNodeToHost,
  unlinkNodeFromHost,
} from './service';
import type { NodeInfo, NodeUpdate } from './model';

export const nodeRoutes = new Elysia({ prefix: '/nodes' })
  // Get all nodes
  .get('/', async () => {
    try {
      const nodes = await getAllNodes();
      return successResponse(nodes);
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get nodes', error);
    }
  }, {
    detail: {
      tags: ['Node'],
      summary: 'Get all nodes',
      description: 'Retrieve all proxy nodes',
    },
  })
  // Get node by ID
  .get('/:id', async ({ params }) => {
    try {
      const node = await getNodeById(Number(params.id));
      if (!node) {
        return errorResponse(ErrorCodes.NODE_NOT_FOUND, `Node with ID ${params.id} not found`);
      }
      return successResponse(node);
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get node', error);
    }
  }, {
    detail: {
      tags: ['Node'],
      summary: 'Get node by ID',
      description: 'Retrieve a specific node by ID',
    },
  })
  // Get nodes by panel
  .get('/panel/:panelType', async ({ params, query }) => {
    try {
      const { panelType } = params;
      const { panelUrl } = query as { panelUrl?: string };

      if (!panelUrl) {
        return errorResponse(ErrorCodes.INVALID_REQUEST, 'panelUrl query parameter is required');
      }

      const nodes = await getNodesByPanel(panelType, panelUrl);
      return successResponse(nodes);
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get nodes by panel', error);
    }
  }, {
    detail: {
      tags: ['Node'],
      summary: 'Get nodes by panel',
      description: 'Retrieve all nodes from a specific panel',
    },
  })
  // Create new node
  .post('/', async ({ body }) => {
    try {
      const nodeInfo = body as NodeInfo;
      const node = await createNode(nodeInfo);
      return successResponse(node);
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create node', error);
    }
  }, {
    detail: {
      tags: ['Node'],
      summary: 'Create new node',
      description: 'Register a new proxy node',
    },
    body: t.Object({
      panelType: t.Union([t.Literal('ssp'), t.Literal('srp')]),
      panelNodeId: t.Integer(),
      panelUrl: t.String(),
      name: t.String(),
      hostId: t.Optional(t.Integer()),
      domain: t.Optional(t.String()),
      port: t.Integer(),
      additionalPorts: t.Optional(t.String()),
      proxyType: t.String(),
      proxyConfig: t.Optional(t.String()),
      isActive: t.Optional(t.Boolean()),
      rateLimit: t.Optional(t.String()),
    }),
  })
  // Update node
  .patch('/:id', async ({ params, body }) => {
    try {
      const update = body as Partial<NodeUpdate>;
      const node = await updateNode(Number(params.id), update);
      if (!node) {
        return errorResponse(ErrorCodes.NODE_NOT_FOUND, `Node with ID ${params.id} not found`);
      }
      return successResponse(node);
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update node', error);
    }
  }, {
    detail: {
      tags: ['Node'],
      summary: 'Update node',
      description: 'Update node information',
    },
    body: t.Object({
      name: t.Optional(t.String()),
      hostId: t.Optional(t.Integer()),
      domain: t.Optional(t.String()),
      port: t.Optional(t.Integer()),
      additionalPorts: t.Optional(t.String()),
      proxyType: t.Optional(t.String()),
      proxyConfig: t.Optional(t.String()),
      isActive: t.Optional(t.Boolean()),
      rateLimit: t.Optional(t.String()),
      userCount: t.Optional(t.Integer()),
    }),
  })
  // Delete node
  .delete('/:id', async ({ params }) => {
    try {
      const deleted = await deleteNode(Number(params.id));
      if (!deleted) {
        return errorResponse(ErrorCodes.NODE_NOT_FOUND, `Node with ID ${params.id} not found`);
      }
      return successResponse({ message: 'Node deleted successfully' });
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete node', error);
    }
  }, {
    detail: {
      tags: ['Node'],
      summary: 'Delete node',
      description: 'Delete a node',
    },
  })
  // Link node to host
  .post('/:id/link/:hostId', async ({ params }) => {
    try {
      const nodeId = Number(params.id);
      const hostId = Number(params.hostId);
      const node = await linkNodeToHost(nodeId, hostId);
      return successResponse(node);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return errorResponse(ErrorCodes.NODE_ASSOCIATION_FAILED, error.message);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to link node to host', error);
    }
  }, {
    detail: {
      tags: ['Node'],
      summary: 'Link node to host',
      description: 'Associate a node with a host (VPS)',
    },
  })
  // Unlink node from host
  .post('/:id/unlink', async ({ params }) => {
    try {
      const node = await unlinkNodeFromHost(Number(params.id));
      return successResponse(node);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return errorResponse(ErrorCodes.NODE_NOT_FOUND, error.message);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to unlink node from host', error);
    }
  }, {
    detail: {
      tags: ['Node'],
      summary: 'Unlink node from host',
      description: 'Remove association between node and host',
    },
  })
  // Get node statistics
  .get('/stats/summary', async () => {
    try {
      const stats = await getNodeStats();
      return successResponse(stats);
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get node stats', error);
    }
  }, {
    detail: {
      tags: ['Node'],
      summary: 'Get node statistics',
      description: 'Get aggregate statistics about all nodes',
    },
  });
