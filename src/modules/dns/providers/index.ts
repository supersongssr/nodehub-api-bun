/**
 * DNS provider factory
 * Creates DNS provider instances based on configuration
 */

import type { DnsProvider } from '../model';
import { CloudflareProvider } from './cloudflare';

export interface DnsProviderConfig {
  provider: 'cloudflare' | 'godaddy' | 'namecheap';
  apiKey: string;
  apiSecret?: string;
  zoneId?: string;
}

export function createDnsProvider(config: DnsProviderConfig): DnsProvider {
  switch (config.provider) {
    case 'cloudflare':
      if (!config.apiKey) {
        throw new Error('Cloudflare requires CLOUDFLARE_API_TOKEN to be set');
      }
      return new CloudflareProvider(config.apiKey, config.zoneId);

    case 'godaddy':
      throw new Error('GoDaddy provider not yet implemented. Please use Cloudflare or implement the provider.');

    case 'namecheap':
      throw new Error('Namecheap provider not yet implemented. Please use Cloudflare or implement the provider.');

    default:
      throw new Error(`Unsupported DNS provider: ${config.provider}`);
  }
}

export * from './cloudflare';

