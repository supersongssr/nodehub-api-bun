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
      return new CloudflareProvider(config.apiKey, config.zoneId);

    // TODO: Add more providers
    // case 'godaddy':
    //   return new GoDaddyProvider(config.apiKey, config.apiSecret);

    default:
      throw new Error(`Unsupported DNS provider: ${config.provider}`);
  }
}

export * from './cloudflare';
