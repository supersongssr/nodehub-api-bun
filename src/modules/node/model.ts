/**
 * Node module data models
 * Defines interfaces for node-related data structures
 */

export interface NodeInfo {
  panelType: 'ssp' | 'srp';
  panelNodeId: number;
  panelUrl: string;
  name: string;
  hostId?: number;
  domain?: string;
  port: number;
  additionalPorts?: string;
  proxyType: string;
  proxyConfig?: string;
  isActive?: boolean;
  rateLimit?: string;
}

export interface NodeUpdate {
  name?: string;
  hostId?: number;
  domain?: string;
  port?: number;
  additionalPorts?: string;
  proxyType?: string;
  proxyConfig?: string;
  isActive?: boolean;
  rateLimit?: string;
  userCount?: number;
}

export interface NodeConfigRequest {
  nodeId: number;
  configType: 'xray' | 'nginx';
  template?: string;
}

export interface NodeAllocationRequest {
  panelType: 'ssp' | 'srp';
  panelNodeId: number;
  panelUrl: string;
  name: string;
  preferredDomain?: string;
  preferredPort?: number;
  proxyType: string;
  rateLimit?: string;
}

export interface NodeStats {
  totalNodes: number;
  activeNodes: number;
  inactiveNodes: number;
  totalUsers: number;
  totalTrafficUsed: number;
}
