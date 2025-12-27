/**
 * Monitor worker
 * Background worker for monitoring hosts and nodes
 */

import { createLogger } from '@/utils/logger';
import { getHosts, markOfflineHosts } from '@/modules/host/service';
import { getNodeStats } from '@/modules/node/service';
import { getTelegramNotifier, notifyHostOffline, notifyLowDisk } from '@/utils/telegram';

const logger = createLogger('MonitorWorker');

export interface MonitorConfig {
  hostHeartbeatTimeout?: number; // seconds
  checkInterval?: number; // milliseconds
  notifyOnHostOffline?: boolean;
  notifyOnLowDisk?: boolean;
  diskThreshold?: number; // percentage
}

class MonitorWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  private config: Required<MonitorConfig> = {
    hostHeartbeatTimeout: 300, // 5 minutes
    checkInterval: 60000, // 1 minute
    notifyOnHostOffline: true,
    notifyOnLowDisk: true,
    diskThreshold: 90, // 90%
  };

  constructor(config?: MonitorConfig) {
    if (config) {
      this.config = { ...this.config, ...config } as Required<MonitorConfig>;
    }
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Monitor worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Monitor worker started');

    // Run immediately on start
    this.runCheck();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.runCheck();
    }, this.config.checkInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    logger.info('Monitor worker stopped');
  }

  /**
   * Run monitoring check
   */
  private async runCheck(): Promise<void> {
    try {
      logger.debug('Running monitoring check');

      // Check host heartbeats
      await this.checkHostHeartbeats();

      // Check disk space
      await this.checkDiskSpace();

      // Log statistics
      await this.logStatistics();
    } catch (error) {
      logger.error('Monitoring check failed', { error });
    }
  }

  /**
   * Check host heartbeats
   */
  private async checkHostHeartbeats(): Promise<void> {
    try {
      const hosts = await getHosts();
      const now = Math.floor(Date.now() / 1000);
      const telegram = getTelegramNotifier();

      for (const host of hosts) {
        if (host.status === 'offline') {
          continue;
        }

        const lastHeartbeat = host.lastHeartbeat || 0;
        const timeSinceHeartbeat = now - lastHeartbeat;

        if (timeSinceHeartbeat > this.config.hostHeartbeatTimeout) {
          logger.warn(`Host offline detected: ${host.name}`);

          if (this.config.notifyOnHostOffline && telegram.isEnabled()) {
            await notifyHostOffline(host.name, lastHeartbeat);
          }
        }
      }

      // Mark offline hosts in database
      await markOfflineHosts(this.config.hostHeartbeatTimeout);
    } catch (error) {
      logger.error('Failed to check host heartbeats', { error });
    }
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace(): Promise<void> {
    try {
      const hosts = await getHosts();
      const telegram = getTelegramNotifier();

      for (const host of hosts) {
        if (!host.diskTotal || host.diskUsed === undefined) {
          continue;
        }

        const diskUsagePercent = (host.diskUsed / host.diskTotal) * 100;

        if (diskUsagePercent >= this.config.diskThreshold) {
          logger.warn(`Low disk space: ${host.name} (${diskUsagePercent.toFixed(1)}%)`);

          if (this.config.notifyOnLowDisk && telegram.isEnabled()) {
            await notifyLowDisk(host.name, diskUsagePercent, host.diskTotal);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to check disk space', { error });
    }
  }

  /**
   * Log system statistics
   */
  private async logStatistics(): Promise<void> {
    try {
      const nodeStats = await getNodeStats();
      logger.debug('System statistics', {
        totalNodes: nodeStats.totalNodes,
        activeNodes: nodeStats.activeNodes,
        totalUsers: nodeStats.totalUsers,
        totalTrafficUsed: nodeStats.totalTrafficUsed,
      });
    } catch (error) {
      logger.error('Failed to log statistics', { error });
    }
  }

  /**
   * Check if worker is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get worker status
   */
  getStatus(): {
    isRunning: boolean;
    config: MonitorConfig;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
    };
  }
}

// Singleton instance
let monitorWorker: MonitorWorker | null = null;

/**
 * Get or create monitor worker instance
 */
export function getMonitorWorker(config?: MonitorConfig): MonitorWorker {
  if (!monitorWorker) {
    monitorWorker = new MonitorWorker(config);
    logger.info('Monitor Worker initialized');
  }
  return monitorWorker;
}

/**
 * Shutdown monitor worker
 */
export function shutdownMonitorWorker(): void {
  if (monitorWorker) {
    monitorWorker.stop();
    logger.info('Monitor Worker shutdown');
  }
}
