/**
 * Configuration loader utility
 * Handles loading and parsing TOML and environment configuration
 *
 * - config.toml: All configuration settings (including $ENV_VAR placeholders)
 * - .env (at root): Sensitive data (API keys, tokens, URLs)
 *
 * Environment variables are loaded automatically by Bun from:
 * 1. .env file at project root
 * 2. System environment variables
 *
 * Placeholders in config.toml:
 * - $ENV_VAR format is replaced with the value from environment variables
 * - If the env var is not set, the placeholder remains as-is (empty string)
 */

import { parse } from 'toml';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface ServerConfig {
  port: number;
  host: string;
}

interface DatabaseConfig {
  path: string;
}

interface SecurityConfig {
  api_key: string;
}

interface DefaultsConfig {
  default_domain: string;
  dns_check_interval: number;
}

interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
}

interface PanelsConfig {
  ssp_enabled: boolean;
  ssp_url: string;
  ssp_api_key: string;
  srp_enabled: boolean;
  srp_url: string;
  srp_api_key: string;
}

interface DnsConfig {
  provider: string;
  zone_id: string;
  cloudflare_api_token: string;
}

interface NotificationsConfig {
  notify_on_node_offline: boolean;
  notify_on_low_disk: boolean;
  disk_threshold: number;
  telegram_bot_token: string;
  telegram_chat_id: string;
}

interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  security: SecurityConfig;
  defaults: DefaultsConfig;
  logging: LoggingConfig;
  panels: PanelsConfig;
  dns: DnsConfig;
  notifications: NotificationsConfig;
}

/**
 * Replace $ENV_VAR placeholders with actual environment variable values
 * Recursively processes all strings in the configuration object
 */
function replaceEnvPlaceholders(obj: any): any {
  if (typeof obj === 'string') {
    // Match $VAR_NAME or ${VAR_NAME} format
    return obj.replace(/^\$([A-Z_][A-Z0-9_]*)|^\$\{([A-Z_][A-Z0-9_]*)\}/g, (_, key1, key2) => {
      const envKey = key1 || key2;
      return process.env[envKey] || '';
    });
  }

  if (Array.isArray(obj)) {
    return obj.map(replaceEnvPlaceholders);
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceEnvPlaceholders(value);
    }
    return result;
  }

  return obj;
}

/**
 * Load TOML configuration file and replace environment variable placeholders
 */
function loadTomlConfig(): AppConfig {
  try {
    const configPath = resolve(process.cwd(), 'config/config.toml');
    const configContent = readFileSync(configPath, 'utf-8');
    const config = parse(configContent) as AppConfig;

    // Replace all $ENV_VAR placeholders with actual values
    return replaceEnvPlaceholders(config);
  } catch (error) {
    // Return default config if file doesn't exist or is invalid
    return {
      server: {
        port: Number(process.env.PORT) || 3000,
        host: process.env.HOST || '0.0.0.0',
      },
      database: {
        path: process.env.DATABASE_PATH || './data/nodehub.db',
      },
      security: {
        api_key: process.env.API_KEY || '',
      },
      defaults: {
        default_domain: process.env.DEFAULT_DOMAIN || '',
        dns_check_interval: Number(process.env.DOMAIN_DNS_CHECK_INTERVAL) || 300,
      },
      logging: {
        level: (process.env.LOG_LEVEL as LoggingConfig['level']) || 'info',
      },
      panels: {
        ssp_enabled: true,
        ssp_url: process.env.SSP_URL || '',
        ssp_api_key: process.env.SSP_API_KEY || '',
        srp_enabled: true,
        srp_url: process.env.SRP_URL || '',
        srp_api_key: process.env.SRP_API_KEY || '',
      },
      dns: {
        provider: process.env.DNS_PROVIDER || 'cloudflare',
        zone_id: process.env.CLOUDFLARE_ZONE_ID || '',
        cloudflare_api_token: process.env.CLOUDFLARE_API_TOKEN || '',
      },
      notifications: {
        notify_on_node_offline: process.env.NOTIFY_ON_NODE_OFFLINE === 'true',
        notify_on_low_disk: process.env.NOTIFY_ON_LOW_DISK === 'true',
        disk_threshold: Number(process.env.DISK_THRESHOLD) || 90,
        telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
        telegram_chat_id: process.env.TELEGRAM_CHAT_ID || '',
      },
    };
  }
}

// Load and export TOML configuration
const config = loadTomlConfig();

export default config;

// Export helper to get environment variables with type safety
export function getEnv(key: string, defaultValue = ''): string {
  return process.env[key] || defaultValue;
}

export function getEnvNumber(key: string, defaultValue = 0): number {
  const value = process.env[key];
  return value ? Number(value) : defaultValue;
}

export function getEnvBool(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return defaultValue;
}

