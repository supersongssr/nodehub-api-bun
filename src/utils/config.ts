/**
 * Configuration loader utility
 * Handles loading and parsing TOML and environment configuration
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

interface DefaultsConfig {
  default_domain: string;
  dns_check_interval: number;
}

interface SecurityConfig {
  api_key: string;
}

interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
}

interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  defaults: DefaultsConfig;
  security: SecurityConfig;
  logging: LoggingConfig;
}

/**
 * Load TOML configuration file
 */
function loadTomlConfig(): AppConfig {
  try {
    const configPath = resolve(process.cwd(), 'config/config.toml');
    const configContent = readFileSync(configPath, 'utf-8');
    const config = parse(configContent) as AppConfig;

    return config;
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
      defaults: {
        default_domain: process.env.DEFAULT_DOMAIN || '',
        dns_check_interval: Number(process.env.DOMAIN_DNS_CHECK_INTERVAL) || 300,
      },
      security: {
        api_key: process.env.API_KEY || '',
      },
      logging: {
        level: (process.env.LOG_LEVEL as LoggingConfig['level']) || 'info',
      },
    };
  }
}

// Load and export configuration
const config = loadTomlConfig();

export default config;
