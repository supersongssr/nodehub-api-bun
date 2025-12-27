/**
 * Host module service
 * Business logic for host management
 */

import { db, hosts, type Host, type NewHost } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createLogger } from '@/utils/logger';
import type { HostInfo, HostUpdate, HostHeartbeat, HostStats } from './model';

const logger = createLogger('HostService');

/**
 * Get all hosts from database
 */
export async function getAllHosts(): Promise<Host[]> {
  try {
    const result = await db.select().from(hosts).orderBy(desc(hosts.createdAt));
    return result;
  } catch (error) {
    logger.error('Failed to get all hosts', { error });
    throw error;
  }
}

/**
 * Get host by ID
 */
export async function getHostById(id: number): Promise<Host | null> {
  try {
    const result = await db.select().from(hosts).where(eq(hosts.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    logger.error(`Failed to get host by id ${id}`, { error });
    throw error;
  }
}

/**
 * Get host by name
 */
export async function getHostByName(name: string): Promise<Host | null> {
  try {
    const result = await db.select().from(hosts).where(eq(hosts.name, name)).limit(1);
    return result[0] || null;
  } catch (error) {
    logger.error(`Failed to get host by name ${name}`, { error });
    throw error;
  }
}

/**
 * Create new host
 */
export async function createHost(hostInfo: HostInfo): Promise<Host> {
  try {
    // Check if host with same name already exists
    const existing = await getHostByName(hostInfo.name);
    if (existing) {
      throw new Error(`Host with name '${hostInfo.name}' already exists`);
    }

    const now = Math.floor(Date.now() / 1000);

    const newHost: NewHost = {
      name: hostInfo.name,
      ip: hostInfo.ip,
      ipv6: hostInfo.ipv6 || null,
      cpuCores: hostInfo.cpuCores,
      cpuUsage: hostInfo.cpuUsage || null,
      memoryTotal: hostInfo.memoryTotal,
      memoryUsed: hostInfo.memoryUsed || null,
      diskTotal: hostInfo.diskTotal,
      diskUsed: hostInfo.diskUsed || null,
      uploadTotal: hostInfo.uploadTotal || 0,
      downloadTotal: hostInfo.downloadTotal || 0,
      lastNetworkReset: hostInfo.lastNetworkReset || now,
      region: hostInfo.region || null,
      city: hostInfo.city || null,
      isp: hostInfo.isp || null,
      status: hostInfo.status || 'unknown',
      uptime: hostInfo.uptime || null,
      lastHeartbeat: hostInfo.lastHeartbeat || now,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.insert(hosts).values(newHost).returning();
    const created = result[0];

    logger.info(`Created new host: ${created.name} (ID: ${created.id})`);
    return created;
  } catch (error) {
    logger.error('Failed to create host', { error, hostInfo });
    throw error;
  }
}

/**
 * Update host information
 */
export async function updateHost(id: number, update: HostUpdate): Promise<Host | null> {
  try {
    const existing = await getHostById(id);
    if (!existing) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    const result = await db
      .update(hosts)
      .set({
        ...update,
        updatedAt: now,
      })
      .where(eq(hosts.id, id))
      .returning();

    const updated = result[0];
    logger.info(`Updated host: ${updated.name} (ID: ${updated.id})`);
    return updated;
  } catch (error) {
    logger.error(`Failed to update host ${id}`, { error });
    throw error;
  }
}

/**
 * Process host heartbeat
 * Called by VPS nodes to report their status
 */
export async function processHeartbeat(heartbeat: HostHeartbeat): Promise<Host> {
  try {
    const host = await getHostByName(heartbeat.name);

    if (!host) {
      // Create new host if doesn't exist
      logger.info(`Auto-creating new host from heartbeat: ${heartbeat.name}`);
      return await createHost({
        name: heartbeat.name,
        ip: '', // Will be filled by subsequent update
        cpuCores: 0, // Will be filled by subsequent update
        memoryTotal: 0,
        diskTotal: 0,
        status: 'online',
        ...heartbeat,
      });
    }

    // Update existing host with heartbeat data
    const now = Math.floor(Date.now() / 1000);
    const result = await db
      .update(hosts)
      .set({
        cpuUsage: heartbeat.cpuUsage,
        memoryUsed: heartbeat.memoryUsed,
        diskUsed: heartbeat.diskUsed,
        uploadTotal: heartbeat.uploadTotal,
        downloadTotal: heartbeat.downloadTotal,
        uptime: heartbeat.uptime,
        status: 'online',
        lastHeartbeat: now,
        updatedAt: now,
      })
      .where(eq(hosts.id, host.id))
      .returning();

    logger.debug(`Processed heartbeat for host: ${host.name}`);
    return result[0];
  } catch (error) {
    logger.error(`Failed to process heartbeat for ${heartbeat.name}`, { error });
    throw error;
  }
}

/**
 * Delete host
 */
export async function deleteHost(id: number): Promise<boolean> {
  try {
    const result = await db.delete(hosts).where(eq(hosts.id, id)).returning();
    const deleted = result[0];

    if (deleted) {
      logger.info(`Deleted host: ${deleted.name} (ID: ${deleted.id})`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to delete host ${id}`, { error });
    throw error;
  }
}

/**
 * Get host statistics
 */
export async function getHostStats(): Promise<HostStats> {
  try {
    const allHosts = await getAllHosts();

    const stats: HostStats = {
      totalHosts: allHosts.length,
      onlineHosts: 0,
      offlineHosts: 0,
      unknownHosts: 0,
      totalTrafficUpload: 0,
      totalTrafficDownload: 0,
    };

    for (const host of allHosts) {
      if (host.status === 'online') {
        stats.onlineHosts++;
      } else if (host.status === 'offline') {
        stats.offlineHosts++;
      } else {
        stats.unknownHosts++;
      }

      stats.totalTrafficUpload += host.uploadTotal || 0;
      stats.totalTrafficDownload += host.downloadTotal || 0;
    }

    return stats;
  } catch (error) {
    logger.error('Failed to get host stats', { error });
    throw error;
  }
}

/**
 * Mark offline hosts
 * Marks hosts as offline if they haven't sent heartbeat in specified time
 */
export async function markOfflineHosts(timeoutSeconds: number = 300): Promise<void> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const threshold = now - timeoutSeconds;

    const result = await db
      .update(hosts)
      .set({
        status: 'offline',
        updatedAt: now,
      })
      .where(sql`${hosts.lastHeartbeat} < ${threshold} AND ${hosts.status} = 'online'`)
      .returning();

    if (result.length > 0) {
      logger.info(`Marked ${result.length} hosts as offline`);
    }
  } catch (error) {
    logger.error('Failed to mark offline hosts', { error });
    throw error;
  }
}
