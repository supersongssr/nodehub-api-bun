/**
 * DNS configuration loader
 * Loads DNS provider settings from environment variables
 */

import type { DnsProviderConfig } from './providers';

/**
 * Get DNS provider configuration from environment
 * Supports multiple DNS providers with provider-specific environment variables
 */
export function getDnsConfig(): DnsProviderConfig {
  const provider = (process.env.DNS_PROVIDER || 'cloudflare').toLowerCase();

  switch (provider) {
    case 'cloudflare':
      return {
        provider: 'cloudflare',
        apiKey: process.env.CLOUDFLARE_API_TOKEN || '',
        zoneId: process.env.CLOUDFLARE_ZONE_ID,
      };

    case 'godaddy':
      return {
        provider: 'godaddy',
        apiKey: process.env.GODADDY_API_KEY || '',
        apiSecret: process.env.GODADDY_API_SECRET || '',
      };

    case 'namecheap':
      return {
        provider: 'namecheap',
        apiKey: process.env.NAMECHEAP_API_KEY || '',
        apiSecret: process.env.NAMECHEAP_USERNAME, // Username acts as secret
      };

    default:
      throw new Error(`Unsupported DNS provider: ${provider}. Supported providers: cloudflare, godaddy, namecheap`);
  }
}

/**
 * Validate DNS configuration
 * Returns true if configuration is valid for the selected provider
 */
export function validateDnsConfig(config: DnsProviderConfig): boolean {
  switch (config.provider) {
    case 'cloudflare':
      return !!config.apiKey; // Only API token is required, zoneId is optional

    case 'godaddy':
      return !!config.apiKey && !!config.apiSecret;

    case 'namecheap':
      return !!config.apiKey && !!config.apiSecret;

    default:
      return false;
  }
}
