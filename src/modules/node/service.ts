/**
 * Node module service
 * Business logic for node management
 */

import { db, nodes, hosts } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createLogger } from '@/utils/logger';
import type { NodeInfo, NodeUpdate, NodeStats } from './model';

const logger = createLogger('NodeService');

/**
 * Get all nodes
 */
export async function getAllNodes(): Promise<typeof nodes.$inferSelect[]> {
  try {
    const result = await db.select().from(nodes).orderBy(desc(nodes.createdAt));
    return result;
  } catch (error) {
    logger.error('Failed to get all nodes', { error });
    throw error;
  }
}

/**
 * Get node by ID
 */
export async function getNodeById(id: number): Promise<typeof nodes.$inferSelect | null> {
  try {
    const result = await db.select().from(nodes).where(eq(nodes.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    logger.error(`Failed to get node by id ${id}`, { error });
    throw error;
  }
}

/**
 * Get nodes by panel
 */
export async function getNodesByPanel(panelType: string, panelUrl: string): Promise<typeof nodes.$inferSelect[]> {
  try {
    const result = await db
      .select()
      .from(nodes)
      .where(and(eq(nodes.panelType, panelType), eq(nodes.panelUrl, panelUrl)))
      .orderBy(desc(nodes.createdAt));
    return result;
  } catch (error) {
    logger.error(`Failed to get nodes for panel ${panelType}`, { error });
    throw error;
  }
}

/**
 * Get node by panel node ID
 */
export async function getNodeByPanelId(panelType: string, panelNodeId: number): Promise<typeof nodes.$inferSelect | null> {
  try {
    const result = await db
      .select()
      .from(nodes)
      .where(and(eq(nodes.panelType, panelType), eq(nodes.panelNodeId, panelNodeId)))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    logger.error(`Failed to get node by panel id ${panelNodeId}`, { error });
    throw error;
  }
}

/**
 * Create new node
 */
export async function createNode(nodeInfo: NodeInfo): Promise<typeof nodes.$inferSelect> {
  try {
    const now = Math.floor(Date.now() / 1000);

    const newNode = {
      panelType: nodeInfo.panelType,
      panelNodeId: nodeInfo.panelNodeId,
      panelUrl: nodeInfo.panelUrl,
      name: nodeInfo.name,
      hostId: nodeInfo.hostId || null,
      domain: nodeInfo.domain || null,
      port: nodeInfo.port,
      additionalPorts: nodeInfo.additionalPorts || null,
      proxyType: nodeInfo.proxyType,
      proxyConfig: nodeInfo.proxyConfig || null,
      isActive: nodeInfo.isActive ?? true,
      rateLimit: nodeInfo.rateLimit || null,
      trafficUsed: 0,
      userCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.insert(nodes).values(newNode).returning();
    const created = result[0];

    logger.info(`Created new node: ${created.name} (ID: ${created.id}, Panel: ${created.panelType})`);
    return created;
  } catch (error) {
    logger.error('Failed to create node', { error, nodeInfo });
    throw error;
  }
}

/**
 * Update node
 */
export async function updateNode(id: number, update: NodeUpdate): Promise<typeof nodes.$inferSelect | null> {
  try {
    const existing = await getNodeById(id);
    if (!existing) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    const result = await db
      .update(nodes)
      .set({
        ...update,
        updatedAt: now,
      })
      .where(eq(nodes.id, id))
      .returning();

    logger.info(`Updated node: ${result[0].name} (ID: ${result[0].id})`);
    return result[0];
  } catch (error) {
    logger.error(`Failed to update node ${id}`, { error });
    throw error;
  }
}

/**
 * Delete node
 */
export async function deleteNode(id: number): Promise<boolean> {
  try {
    const result = await db.delete(nodes).where(eq(nodes.id, id)).returning();
    const deleted = result[0];

    if (deleted) {
      logger.info(`Deleted node: ${deleted.name} (ID: ${deleted.id})`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to delete node ${id}`, { error });
    throw error;
  }
}

/**
 * Get node statistics
 */
export async function getNodeStats(): Promise<NodeStats> {
  try {
    const allNodes = await getAllNodes();

    const stats: NodeStats = {
      totalNodes: allNodes.length,
      activeNodes: 0,
      inactiveNodes: 0,
      totalUsers: 0,
      totalTrafficUsed: 0,
    };

    for (const node of allNodes) {
      if (node.isActive) {
        stats.activeNodes++;
      } else {
        stats.inactiveNodes++;
      }

      stats.totalUsers += node.userCount || 0;
      stats.totalTrafficUsed += node.trafficUsed || 0;
    }

    return stats;
  } catch (error) {
    logger.error('Failed to get node stats', { error });
    throw error;
  }
}

/**
 * Link node to host
 */
export async function linkNodeToHost(nodeId: number, hostId: number): Promise<typeof nodes.$inferSelect | null> {
  try {
    // Verify host exists
    const host = await db.select().from(hosts).where(eq(hosts.id, hostId)).limit(1);
    if (!host[0]) {
      throw new Error(`Host with ID ${hostId} not found`);
    }

    const node = await updateNode(nodeId, { hostId });
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    logger.info(`Linked node ${nodeId} to host ${hostId}`);
    return node;
  } catch (error) {
    logger.error(`Failed to link node ${nodeId} to host ${hostId}`, { error });
    throw error;
  }
}

/**
 * Unlink node from host
 */
export async function unlinkNodeFromHost(nodeId: number): Promise<typeof nodes.$inferSelect | null> {
  try {
    const node = await updateNode(nodeId, { hostId: undefined });
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    logger.info(`Unlinked node ${nodeId} from host`);
    return node;
  } catch (error) {
    logger.error(`Failed to unlink node ${nodeId} from host`, { error });
    throw error;
  }
}
