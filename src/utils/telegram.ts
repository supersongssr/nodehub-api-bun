/**
 * Telegram notification utility
 * Handles sending notifications via Telegram bot
 */

import { createLogger } from './logger';

const logger = createLogger('Telegram');

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface NotificationMessage {
  title?: string;
  message: string;
  level?: 'info' | 'warning' | 'error';
  metadata?: Record<string, unknown>;
}

class TelegramNotifier {
  private botToken: string;
  private chatId: string;
  private enabled: boolean;

  constructor(config?: TelegramConfig) {
    this.botToken = config?.botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = config?.chatId || process.env.TELEGRAM_CHAT_ID || '';
    this.enabled = !!(this.botToken && this.chatId);

    if (!this.enabled) {
      logger.warn('Telegram notifications disabled (missing credentials)');
    }
  }

  /**
   * Send message via Telegram bot
   */
  async send(message: NotificationMessage): Promise<boolean> {
    if (!this.enabled) {
      logger.debug('Telegram notification skipped (disabled)');
      return false;
    }

    try {
      const text = this.formatMessage(message);

      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API error: ${error}`);
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }

      logger.info('Telegram notification sent', { title: message.title });
      return true;
    } catch (error) {
      logger.error('Failed to send Telegram notification', { error, message });
      return false;
    }
  }

  /**
   * Format message for Telegram
   */
  private formatMessage(message: NotificationMessage): string {
    const emoji = this.getEmoji(message.level || 'info');
    let text = '';

    if (message.title) {
      text += `${emoji} <b>${message.title}</b>\n\n`;
    }

    text += message.message;

    if (message.metadata && Object.keys(message.metadata).length > 0) {
      text += '\n\n<b>Details:</b>\n';
      text += '<pre>';
      for (const [key, value] of Object.entries(message.metadata)) {
        text += `${key}: ${JSON.stringify(value)}\n`;
      }
      text += '</pre>';
    }

    return text;
  }

  /**
   * Get emoji for message level
   */
  private getEmoji(level: string): string {
    switch (level) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  }

  /**
   * Check if Telegram is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
let telegramInstance: TelegramNotifier | null = null;

/**
 * Get or create Telegram notifier instance
 */
export function getTelegramNotifier(config?: TelegramConfig): TelegramNotifier {
  if (!telegramInstance) {
    telegramInstance = new TelegramNotifier(config);
  }
  return telegramInstance;
}

/**
 * Send notification convenience function
 */
export async function sendNotification(message: NotificationMessage): Promise<boolean> {
  const notifier = getTelegramNotifier();
  return await notifier.send(message);
}

/**
 * Send host offline notification
 */
export async function notifyHostOffline(hostName: string, lastHeartbeat?: number): Promise<boolean> {
  return await sendNotification({
    title: 'Host Offline',
    level: 'error',
    message: `Host <b>${hostName}</b> is offline`,
    metadata: lastHeartbeat ? { lastHeartbeat: new Date(lastHeartbeat * 1000).toISOString() } : undefined,
  });
}

/**
 * Send low disk space warning
 */
export async function notifyLowDisk(hostName: string, diskUsage: number, diskTotal: number): Promise<boolean> {
  return await sendNotification({
    title: 'Low Disk Space',
    level: 'warning',
    message: `Host <b>${hostName}</b> has low disk space: <b>${diskUsage}%</b> used`,
    metadata: {
      diskUsed: `${diskUsage}%`,
      diskTotal: `${diskTotal} GB`,
    },
  });
}

/**
 * Send DNS update failure notification
 */
export async function notifyDnsUpdateFailed(domain: string, error: string): Promise<boolean> {
  return await sendNotification({
    title: 'DNS Update Failed',
    level: 'error',
    message: `Failed to update DNS record for <b>${domain}</b>`,
    metadata: { error },
  });
}

/**
 * Send panel sync notification
 */
export async function notifyPanelSync(panelId: string, nodeCount: number, success: boolean): Promise<boolean> {
  return await sendNotification({
    title: success ? 'Panel Sync Completed' : 'Panel Sync Failed',
    level: success ? 'info' : 'error',
    message: `Panel <b>${panelId}</b> sync ${success ? 'completed' : 'failed'}`,
    metadata: { nodeCount },
  });
}
