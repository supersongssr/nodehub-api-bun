/**
 * Cloudflare DNS provider adapter
 */

import type { DnsProvider } from '../model';
import { createLogger } from '@/utils/logger';

const logger = createLogger('CloudflareDNS');

export class CloudflareProvider implements DnsProvider {
  name = 'cloudflare';
  private apiToken: string;
  private zoneId?: string;

  constructor(apiToken: string, zoneId?: string) {
    this.apiToken = apiToken;
    this.zoneId = zoneId;
  }

  /**
   * Update DNS record
   */
  async updateRecord(domain: string, type: string, value: string): Promise<boolean> {
    try {
      // Get zone ID if not provided
      const zoneId = this.zoneId || (await this.getZoneId(domain));
      if (!zoneId) {
        throw new Error('Could not determine zone ID');
      }

      // Check if record exists
      const existingRecord = await this.findRecord(zoneId, domain, type);

      if (existingRecord) {
        // Update existing record
        await this.updateExistingRecord(zoneId, existingRecord.id, value);
        logger.info(`Updated DNS record: ${domain} (${type}) -> ${value}`);
      } else {
        // Create new record
        await this.createNewRecord(zoneId, domain, type, value);
        logger.info(`Created DNS record: ${domain} (${type}) -> ${value}`);
      }

      return true;
    } catch (error) {
      logger.error(`Failed to update DNS record for ${domain}`, { error });
      return false;
    }
  }

  /**
   * Get DNS record value
   */
  async getRecord(domain: string, type: string): Promise<string | null> {
    try {
      const zoneId = this.zoneId || (await this.getZoneId(domain));
      if (!zoneId) {
        return null;
      }

      const record = await this.findRecord(zoneId, domain, type);
      return record?.content || null;
    } catch (error) {
      logger.error(`Failed to get DNS record for ${domain}`, { error });
      return null;
    }
  }

  /**
   * Get zone ID for domain
   */
  private async getZoneId(domain: string): Promise<string | null> {
    try {
      const baseDomain = this.getBaseDomain(domain);
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${baseDomain}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success && data.result.length > 0) {
        return data.result[0].id;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get zone ID', { error });
      return null;
    }
  }

  /**
   * Find existing DNS record
   */
  private async findRecord(zoneId: string, domain: string, type: string): Promise<any | null> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=${type}&name=${domain}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success && data.result.length > 0) {
        return data.result[0];
      }

      return null;
    } catch (error) {
      logger.error('Failed to find DNS record', { error });
      return null;
    }
  }

  /**
   * Update existing DNS record
   */
  private async updateExistingRecord(zoneId: string, recordId: string, value: string): Promise<void> {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: value }),
    });
  }

  /**
   * Create new DNS record
   */
  private async createNewRecord(zoneId: string, domain: string, type: string, value: string): Promise<void> {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        name: domain,
        content: value,
        ttl: 1, // Auto TTL
      }),
    });
  }

  /**
   * Extract base domain from subdomain
   */
  private getBaseDomain(domain: string): string {
    const parts = domain.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return domain;
  }
}
