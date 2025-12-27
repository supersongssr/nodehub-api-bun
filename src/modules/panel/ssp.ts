/**
 * SSP (Shadowsocks Panel) adapter
 */

import type { PanelAdapter, PanelNode, PanelUser } from './model';
import { createLogger } from '@/utils/logger';

const logger = createLogger('SSPAdapter');

export class SSPAdapter implements PanelAdapter {
  type = 'ssp' as const;
  url: string;
  apiKey: string;

  constructor(url: string, apiKey: string) {
    this.url = url.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  /**
   * Make authenticated API request to SSP panel
   */
  private async apiRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    try {
      const url = `${this.url}${endpoint}`;
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`SSP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`SSP API request failed: ${endpoint}`, { error });
      throw error;
    }
  }

  /**
   * Get all nodes from SSP panel
   */
  async getNodes(): Promise<PanelNode[]> {
    try {
      const data = await this.apiRequest('/api/nodes');

      if (!data.data) {
        return [];
      }

      return data.data.map((node: any) => ({
        id: node.id,
        name: node.name,
        type: node.type || 'shadowsocks',
        host: node.host || node.server,
        port: node.port,
        rateLimit: node.rate_limit || node.rateLimit || '0',
        isActive: node.is_active || node.isActive || true,
        trafficUsed: node.traffic_used || node.trafficUsed || 0,
        userCount: node.user_count || node.userCount || 0,
      }));
    } catch (error) {
      logger.error('Failed to get nodes from SSP panel', { error });
      return [];
    }
  }

  /**
   * Get specific node from SSP panel
   */
  async getNode(nodeId: number): Promise<PanelNode | null> {
    try {
      const data = await this.apiRequest(`/api/nodes/${nodeId}`);

      if (!data.data) {
        return null;
      }

      const node = data.data;
      return {
        id: node.id,
        name: node.name,
        type: node.type || 'shadowsocks',
        host: node.host || node.server,
        port: node.port,
        rateLimit: node.rate_limit || node.rateLimit || '0',
        isActive: node.is_active || node.isActive || true,
        trafficUsed: node.traffic_used || node.trafficUsed || 0,
        userCount: node.user_count || node.userCount || 0,
      };
    } catch (error) {
      logger.error(`Failed to get node ${nodeId} from SSP panel`, { error });
      return null;
    }
  }

  /**
   * Update node in SSP panel
   */
  async updateNode(nodeId: number, data: Partial<PanelNode>): Promise<boolean> {
    try {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.host) updateData.host = data.host;
      if (data.port) updateData.port = data.port;
      if (data.rateLimit) updateData.rate_limit = data.rateLimit;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      await this.apiRequest(`/api/nodes/${nodeId}`, 'PUT', updateData);
      return true;
    } catch (error) {
      logger.error(`Failed to update node ${nodeId} in SSP panel`, { error });
      return false;
    }
  }

  /**
   * Get users for a node
   */
  async getUsers(nodeId: number): Promise<PanelUser[]> {
    try {
      const data = await this.apiRequest(`/api/nodes/${nodeId}/users`);

      if (!data.data) {
        return [];
      }

      return data.data.map((user: any) => ({
        id: user.id,
        username: user.username || user.email,
        nodeId: user.node_id || user.nodeId || nodeId,
        trafficUsed: user.traffic_used || user.trafficUsed || 0,
        trafficLimit: user.traffic_limit || user.trafficLimit || 0,
        isActive: user.is_active || user.isActive || true,
      }));
    } catch (error) {
      logger.error(`Failed to get users for node ${nodeId} from SSP panel`, { error });
      return [];
    }
  }

  /**
   * Get user traffic usage
   */
  async getUserTraffic(nodeId: number, userId: number): Promise<number> {
    try {
      const data = await this.apiRequest(`/api/nodes/${nodeId}/users/${userId}/traffic`);
      return data.data?.traffic_used || data.data?.trafficUsed || 0;
    } catch (error) {
      logger.error(`Failed to get traffic for user ${userId} in node ${nodeId}`, { error });
      return 0;
    }
  }

  /**
   * Sync all nodes from SSP panel
   */
  async syncNodes(): Promise<PanelNode[]> {
    logger.info('Syncing nodes from SSP panel');
    return await this.getNodes();
  }
}
