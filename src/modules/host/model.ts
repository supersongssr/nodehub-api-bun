/**
 * Host module data models
 * Defines interfaces for host-related data structures
 */

export interface HostInfo {
  name: string;
  ip: string;
  ipv6?: string;
  cpuCores: number;
  cpuUsage?: number;
  memoryTotal: number;
  memoryUsed?: number;
  diskTotal: number;
  diskUsed?: number;
  uploadTotal?: number;
  downloadTotal?: number;
  lastNetworkReset?: number;
  region?: string;
  city?: string;
  isp?: string;
  status?: string;
  uptime?: number;
  lastHeartbeat?: number;
}

export interface HostUpdate {
  cpuUsage?: number;
  memoryUsed?: number;
  diskUsed?: number;
  uploadTotal?: number;
  downloadTotal?: number;
  status?: string;
  uptime?: number;
  lastHeartbeat?: number;
}

export interface HostHeartbeat {
  name: string;
  cpuUsage: number;
  memoryUsed: number;
  diskUsed: number;
  uploadTotal: number;
  downloadTotal: number;
  uptime: number;
  timestamp: number;
}

export interface HostStats {
  totalHosts: number;
  onlineHosts: number;
  offlineHosts: number;
  unknownHosts: number;
  totalTrafficUpload: number;
  totalTrafficDownload: number;
}
