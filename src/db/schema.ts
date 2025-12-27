import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Host table - VPS host information
 * Represents physical VPS servers reporting their status
 */
export const hosts = sqliteTable('hosts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Basic identification
  name: text('name').notNull().unique(), // Host unique identifier (e.g., hostname)
  ip: text('ip').notNull(), // Primary IP address
  ipv6: text('ipv6'), // IPv6 address (optional)

  // Hardware info
  cpuCores: integer('cpu_cores').notNull(), // Number of CPU cores
  cpuUsage: real('cpu_usage'), // Current CPU usage percentage
  memoryTotal: integer('memory_total').notNull(), // Total memory in MB
  memoryUsed: integer('memory_used'), // Used memory in MB
  diskTotal: integer('disk_total').notNull(), // Total disk space in GB
  diskUsed: integer('disk_used'), // Used disk space in GB

  // Network info
  uploadTotal: integer('upload_total').notNull().default(0), // Total upload bytes
  downloadTotal: integer('download_total').notNull().default(0), // Total download bytes
  lastNetworkReset: integer('last_network_reset'), // Timestamp of last traffic reset

  // Location info
  region: text('region'), // Region/country code (e.g., US, CN)
  city: text('city'), // City name
  isp: text('isp'), // ISP name

  // Status
  status: text('status').notNull().default('unknown'), // online, offline, unknown
  uptime: integer('uptime'), // Uptime in seconds
  lastHeartbeat: integer('last_heartbeat'), // Unix timestamp of last heartbeat

  // Metadata
  createdAt: integer('created_at').notNull(), // Unix timestamp
  updatedAt: integer('updated_at').notNull(), // Unix timestamp
});

/**
 * Node table - Proxy node instances
 * Represents proxy nodes managed by panels (SSP/SRP)
 */
export const nodes = sqliteTable('nodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Panel integration
  panelType: text('panel_type').notNull(), // 'ssp' or 'srp'
  panelNodeId: integer('panel_node_id').notNull(), // Node ID in panel database
  panelUrl: text('panel_url').notNull(), // Panel API URL

  // Node configuration
  name: text('name').notNull(), // Node display name
  hostId: integer('host_id').references(() => hosts.id), // Associated host (optional)

  // Network settings
  domain: text('domain'), // Main domain for this node
  port: integer('port').notNull(), // Main port number
  additionalPorts: text('additional_ports'), // Comma-separated additional ports

  // Proxy configuration
  proxyType: text('proxy_type').notNull(), // v2ray, xray, trojan, etc.
  proxyConfig: text('proxy_config'), // JSON string with proxy settings

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true), // Node active status
  rateLimit: text('rate_limit'), // Rate limit string (e.g., "100M")
  trafficUsed: integer('traffic_used').notNull().default(0), // Total traffic used in bytes
  userCount: integer('user_count').notNull().default(0), // Number of users on this node

  // Metadata
  createdAt: integer('created_at').notNull(), // Unix timestamp
  updatedAt: integer('updated_at').notNull(), // Unix timestamp
});

/**
 * Config table - System-wide configuration
 * Stores system configuration settings
 */
export const configs = sqliteTable('configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Panel configurations
  sspUrl: text('ssp_url'), // SSP panel URL
  sspApiKey: text('ssp_api_key'), // SSP panel API key
  srpUrl: text('srp_url'), // SRP panel URL
  srpApiKey: text('srp_api_key'), // SRP panel API key

  // DNS configuration
  dnsProvider: text('dns_provider').notNull().default('cloudflare'), // cloudflare, godaddy, etc.
  dnsApiKey: text('dns_api_key'), // DNS provider API key
  dnsApiSecret: text('dns_api_secret'), // DNS provider API secret (if needed)

  // Domain settings
  defaultDomain: text('default_domain'), // Default domain for new nodes
  domainDnsCheckInterval: integer('domain_dns_check_interval').notNull().default(300), // DNS check interval in seconds

  // Notification settings
  telegramBotToken: text('telegram_bot_token'), // Telegram bot token
  telegramChatId: text('telegram_chat_id'), // Telegram chat ID for notifications
  notifyOnNodeOffline: integer('notify_on_node_offline', { mode: 'boolean' }).notNull().default(true),
  notifyOnLowDisk: integer('notify_on_low_disk', { mode: 'boolean' }).notNull().default(true),
  diskThreshold: integer('disk_threshold').notNull().default(90), // Disk usage threshold percentage

  // Metadata
  createdAt: integer('created_at').notNull(), // Unix timestamp
  updatedAt: integer('updated_at').notNull(), // Unix timestamp
});

/**
 * DnsRecords table - DNS record management
 * Tracks DNS records managed by the system
 */
export const dnsRecords = sqliteTable('dns_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Record information
  nodeId: integer('node_id').notNull().references(() => nodes.id), // Associated node
  domain: text('domain').notNull(), // Full domain name
  type: text('type').notNull(), // Record type (A, AAAA, CNAME)
  value: text('value').notNull(), // Record value (IP address or domain)

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastChecked: integer('last_checked'), // Unix timestamp of last DNS check
  lastUpdated: integer('last_updated'), // Unix timestamp of last DNS update

  // Metadata
  createdAt: integer('created_at').notNull(), // Unix timestamp
  updatedAt: integer('updated_at').notNull(), // Unix timestamp
});

/**
 * Type exports for TypeScript usage
 */
export type Host = typeof hosts.$inferSelect;
export type NewHost = typeof hosts.$inferInsert;
export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
export type Config = typeof configs.$inferSelect;
export type NewConfig = typeof configs.$inferInsert;
export type DnsRecord = typeof dnsRecords.$inferSelect;
export type NewDnsRecord = typeof dnsRecords.$inferInsert;
