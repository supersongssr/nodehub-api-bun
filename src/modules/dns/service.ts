/**
 * DNS module service
 * Handles DNS record management
 */

import { db, dnsRecords } from '@/db';
import { eq } from 'drizzle-orm';
import { createLogger } from '@/utils/logger';
import { createDnsProvider } from './providers';
import type { DnsProviderConfig } from './providers';
import type { DnsUpdateRequest, DnsCheckRequest } from './model';

const logger = createLogger('DnsService');

// Default provider instance (will be initialized with config)
let defaultProvider: ReturnType<typeof createDnsProvider> | null = null;

/**
 * Initialize DNS provider from environment/config
 */
export function initializeDnsProvider(config: DnsProviderConfig): void {
  try {
    defaultProvider = createDnsProvider(config);
    logger.info(`DNS provider initialized: ${config.provider}`);
  } catch (error) {
    logger.error('Failed to initialize DNS provider', { error });
    throw error;
  }
}

/**
 * Update DNS record for a node
 */
export async function updateDnsRecord(request: DnsUpdateRequest): Promise<boolean> {
  try {
    if (!defaultProvider) {
      throw new Error('DNS provider not initialized');
    }

    // Verify node exists
    const node = await db.select().from(dnsRecords).where(eq(dnsRecords.nodeId, request.nodeId)).limit(1);

    // Update DNS record
    const success = await defaultProvider.updateRecord(request.domain, request.type, request.value);

    if (success) {
      const now = Math.floor(Date.now() / 1000);

      // Update database record
      if (node.length > 0) {
        await db
          .update(dnsRecords)
          .set({
            domain: request.domain,
            type: request.type,
            value: request.value,
            lastUpdated: now,
            updatedAt: now,
          })
          .where(eq(dnsRecords.id, node[0].id));
      } else {
        await db.insert(dnsRecords).values({
          nodeId: request.nodeId,
          domain: request.domain,
          type: request.type,
          value: request.value,
          isActive: true,
          lastChecked: now,
          lastUpdated: now,
          createdAt: now,
          updatedAt: now,
        });
      }

      logger.info(`DNS record updated: ${request.domain} -> ${request.value}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`Failed to update DNS record for ${request.domain}`, { error });
    throw error;
  }
}

/**
 * Check DNS record
 */
export async function checkDnsRecord(request: DnsCheckRequest): Promise<{
  domain: string;
  currentValue: string | null;
  matches: boolean;
}> {
  try {
    if (!defaultProvider) {
      throw new Error('DNS provider not initialized');
    }

    // Try to get A record
    const currentValue = await defaultProvider.getRecord(request.domain, 'A');

    const matches = request.expectedValue ? currentValue === request.expectedValue : true;

    return {
      domain: request.domain,
      currentValue,
      matches,
    };
  } catch (error) {
    logger.error(`Failed to check DNS record for ${request.domain}`, { error });
    throw error;
  }
}

/**
 * Get all DNS records for a node
 */
export async function getNodeDnsRecords(nodeId: number): Promise<typeof dnsRecords.$inferSelect[]> {
  try {
    const records = await db.select().from(dnsRecords).where(eq(dnsRecords.nodeId, nodeId));
    return records;
  } catch (error) {
    logger.error(`Failed to get DNS records for node ${nodeId}`, { error });
    throw error;
  }
}

/**
 * Delete DNS record
 */
export async function deleteDnsRecord(recordId: number): Promise<boolean> {
  try {
    const result = await db.delete(dnsRecords).where(eq(dnsRecords.id, recordId)).returning();
    return result.length > 0;
  } catch (error) {
    logger.error(`Failed to delete DNS record ${recordId}`, { error });
    throw error;
  }
}
