/**
 * SRP (ShadowsocksR Panel) adapter
 */

import type { PanelAdapter, PanelNode, PanelUser } from './model';
import { createLogger } from '@/utils/logger';

const logger = createLogger('SRPAdapter');

export class SRPAdapter implements PanelAdapter {
  type = 'srp' as const;
  url: string;
  apiKey: string;

  constructor(url: string, apiKey: string) {
    this.url = url.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  /**
   * Make authenticated API request to SRP panel
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
        throw new Error(`SRP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`SRP API request failed: ${endpoint}`, { error });
      throw error;
    }
  }

  /**
   * Get all nodes from SRP panel
   */
  async getNodes(): Promise<PanelNode[]> {
    try {
      const data = await this.apiRequest('/api/server');

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((node: any) => ({
        id: node.id,
        name: node.name || node.remark,
        type: node.type || 'shadowsocksr',
        host: node.address || node.host,
        port: node.port,
        rateLimit: node.rate_limit || '0',
        isActive: node.is_active || true,
        trafficUsed: node.traffic_used || 0,
        userCount: node.user_count || 0,
      }));
    } catch (error) {
      logger.error('Failed to get nodes from SRP panel', { error });
      return [];
    }
  }

  /**
   * Get specific node from SRP panel
   */
  async getNode(nodeId: number): Promise<PanelNode | null> {
    try {
      const data = await this.apiRequest(`/api/server/${nodeId}`);

      if (!data.data) {
        return null;
      }

      const node = data.data;
      return {
        id: node.id,
        name: node.name || node.remark,
        type: node.type || 'shadowsocksr',
        host: node.address || node.host,
        port: node.port,
        rateLimit: node.rate_limit || '0',
        isActive: node.is_active || true,
        trafficUsed: node.traffic_used || 0,
        userCount: node.user_count || 0,
      };
    } catch (error) {
      logger.error(`Failed to get node ${nodeId} from SRP panel`, { error });
      return null;
    }
  }

  /**
   * Update node in SRP panel
   */
  async updateNode(nodeId: number, data: Partial<PanelNode>): Promise<boolean> {
    try {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.host) updateData.address = data.host;
      if (data.port) updateData.port = data.port;
      if (data.rateLimit) updateData.rate_limit = data.rateLimit;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      await this.apiRequest(`/api/server/${nodeId}`, 'PUT', updateData);
      return true;
    } catch (error) {
      logger.error(`Failed to update node ${nodeId} in SRP panel', { error });
      return false;
    }
  }

  /**
   * Get users for a node
   */
  async getUsers(nodeId: number): Promise<PanelUser[]> {
    try {
      const data = await this.apiRequest(`/api/server/${nodeId}/users`);

      if (!data.data) {
        return [];
      }

      return data.data.map((user: any) => ({
        id: user.id,
        username: user.email || user.username,
        nodeId: user.server_id || nodeId,
        trafficUsed: user.u + user.d || user.traffic_used || 0,
        trafficLimit: user.transfer_enable || user.traffic_limit || 0,
        isActive: user.enable || user.is_active || true,
      }));
    } catch (error) {
      logger.error(`Failed to get users for node ${nodeId} from SRP panel', { error });
      return [];
    }
  }

  /**
   * Get user traffic usage
   */
  async getUserTraffic(nodeId: number, userId: number): Promise<number> {
    try {
      const data = await this.apiRequest(`/api/server/${nodeId}/users/${userId}`);
      return data.data?.u + data.data?.d || data.data?.traffic_used || 0;
    } catch (error) {
      logger.error(`Failed to get traffic for user ${userId} in node ${nodeId}', { error });
      return 0;
    }
  }

  /**
   * Sync all nodes from SRP panel
   */
  async syncNodes(): Promise<PanelNode[]> {
    logger.info('Syncing nodes from SRP panel');
    return await this.getNodes();
  }
}
