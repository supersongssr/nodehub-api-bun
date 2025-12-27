/**
 * DNS Worker
 * Background worker for processing DNS updates with PQueue
 */

import PQueue from 'p-queue';
import { createLogger } from '@/utils/logger';
import { updateDnsRecord } from '@/modules/dns/service';
import type { DnsUpdateRequest } from '@/modules/dns/model';

const logger = createLogger('DnsWorker');

/**
 * DNS Worker class
 * Manages DNS update queue
 */
export class DnsWorker {
  private queue: PQueue;
  private isRunning: boolean = false;

  constructor(concurrency: number = 1, interval: number = 1000) {
    // Create queue with concurrency limit and interval between tasks
    this.queue = new PQueue({
      concurrency,
      interval,
      autoStart: true,
    });

    this.queue.on('idle', () => {
      logger.debug('DNS queue is idle');
    });

    this.queue.on('error', (error) => {
      logger.error('DNS queue error', { error });
    });
  }

  /**
   * Add DNS update task to queue
   */
  async addUpdateTask(request: DnsUpdateRequest): Promise<boolean> {
    try {
      const result = await this.queue.add(async () => {
        logger.info(`Processing DNS update: ${request.domain} (${request.type})`);
        return await updateDnsRecord(request);
      });

      return result || false;
    } catch (error) {
      logger.error(`Failed to queue DNS update for ${request.domain}`, { error });
      return false;
    }
  }

  /**
   * Add multiple DNS update tasks
   */
  async addUpdateTasks(requests: DnsUpdateRequest[]): Promise<boolean[]> {
    const tasks = requests.map((request) => this.addUpdateTask(request));
    return await Promise.all(tasks);
  }

  /**
   * Get queue size
   */
  getSize(): number {
    return this.queue.size;
  }

  /**
   * Get queue status
   */
  getStatus(): {
    size: number;
    pending: number;
    isPaused: boolean;
  } {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      isPaused: this.queue.isPaused,
    };
  }

  /**
   * Pause the queue
   */
  pause(): void {
    this.queue.pause();
    logger.info('DNS queue paused');
  }

  /**
   * Start the queue
   */
  start(): void {
    this.queue.start();
    logger.info('DNS queue started');
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue.clear();
    logger.info('DNS queue cleared');
  }
}

// Singleton instance
let dnsWorker: DnsWorker | null = null;

/**
 * Get or create DNS worker instance
 */
export function getDnsWorker(): DnsWorker {
  if (!dnsWorker) {
    dnsWorker = new DnsWorker(
      Number(process.env.DNS_QUEUE_CONCURRENCY) || 1,
      Number(process.env.DNS_QUEUE_INTERVAL) || 1000
    );
    logger.info('DNS Worker initialized');
  }
  return dnsWorker;
}

/**
 * Shutdown DNS worker
 */
export async function shutdownDnsWorker(): Promise<void> {
  if (dnsWorker) {
    dnsWorker.pause();
    dnsWorker.clear();
    logger.info('DNS Worker shutdown');
  }
}
