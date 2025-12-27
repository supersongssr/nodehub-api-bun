/**
 * Panel module data models
 */

export interface PanelAdapter {
  type: 'ssp' | 'srp';
  url: string;
  apiKey: string;

  // Node operations
  getNodes(): Promise<PanelNode[]>;
  getNode(nodeId: number): Promise<PanelNode | null>;
  updateNode(nodeId: number, data: Partial<PanelNode>): Promise<boolean>;

  // User operations
  getUsers(nodeId: number): Promise<PanelUser[]>;
  getUserTraffic(nodeId: number, userId: number): Promise<number>;

  // Sync operations
  syncNodes(): Promise<PanelNode[]>;
}

export interface PanelNode {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  rateLimit: string;
  isActive: boolean;
  trafficUsed: number;
  userCount: number;
}

export interface PanelUser {
  id: number;
  username: string;
  nodeId: number;
  trafficUsed: number;
  trafficLimit: number;
  isActive: boolean;
}

export interface PanelConfig {
  type: 'ssp' | 'srp';
  url: string;
  apiKey: string;
  syncInterval?: number;
}
