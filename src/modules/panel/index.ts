/**
 * Panel adapter factory and service
 * Manages panel integrations (SSP, SRP)
 */

import { SSPAdapter } from './ssp';
import { SRPAdapter } from './srp';
import type { PanelAdapter, PanelConfig, PanelNode } from './model';
import { createLogger } from '@/utils/logger';

const logger = createLogger('PanelService');

// Active panel connections
const activePanels = new Map<string, PanelAdapter>();

/**
 * Create panel adapter from config
 */
export function createPanelAdapter(config: PanelConfig): PanelAdapter {
  switch (config.type) {
    case 'ssp':
      return new SSPAdapter(config.url, config.apiKey);

    case 'srp':
      return new SRPAdapter(config.url, config.apiKey);

    default:
      throw new Error(`Unsupported panel type: ${config.type}`);
  }
}

/**
 * Register panel connection
 */
export function registerPanel(id: string, config: PanelConfig): PanelAdapter {
  const adapter = createPanelAdapter(config);
  activePanels.set(id, adapter);
  logger.info(`Panel registered: ${id} (${config.type})`);
  return adapter;
}

/**
 * Get panel adapter by ID
 */
export function getPanel(id: string): PanelAdapter | undefined {
  return activePanels.get(id);
}

/**
 * Unregister panel connection
 */
export function unregisterPanel(id: string): boolean {
  const result = activePanels.delete(id);
  if (result) {
    logger.info(`Panel unregistered: ${id}`);
  }
  return result;
}

/**
 * Sync nodes from all registered panels
 */
export async function syncAllPanels(): Promise<PanelNode[]> {
  const allNodes: PanelNode[] = [];

  for (const [id, panel] of activePanels.entries()) {
    try {
      logger.info(`Syncing nodes from panel: ${id}`);
      const nodes = await panel.syncNodes();
      allNodes.push(...nodes);
      logger.info(`Synced ${nodes.length} nodes from panel: ${id}`);
    } catch (error) {
      logger.error(`Failed to sync nodes from panel: ${id}`, { error });
    }
  }

  return allNodes;
}

/**
 * Get node from specific panel
 */
export async function getPanelNode(panelId: string, nodeId: number): Promise<PanelNode | null> {
  const panel = activePanels.get(panelId);
  if (!panel) {
    throw new Error(`Panel not found: ${panelId}`);
  }

  return await panel.getNode(nodeId);
}

/**
 * Update node in specific panel
 */
export async function updatePanelNode(panelId: string, nodeId: number, data: Partial<PanelNode>): Promise<boolean> {
  const panel = activePanels.get(panelId);
  if (!panel) {
    throw new Error(`Panel not found: ${panelId}`);
  }

  return await panel.updateNode(nodeId, data);
}

export * from './model';
export * from './ssp';
export * from './srp';
