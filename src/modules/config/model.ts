/**
 * Config module data models
 * Defines interfaces for configuration distribution
 */

export interface ConfigRequest {
  nodeId: number;
  configType: 'xray' | 'nginx';
  template?: string;
}

export interface ConfigTemplate {
  name: string;
  type: 'xray' | 'nginx';
  content: string;
  variables: string[];
}

export interface ConfigRenderOptions {
  nodeId: number;
  template?: string;
  variables?: Record<string, string | number | boolean>;
}

export interface NodeConfigContext {
  id: number;
  name: string;
  domain: string;
  port: number;
  additionalPorts: number[];
  proxyType: string;
  proxyConfig: Record<string, unknown>;
  host?: {
    ip: string;
    ipv6?: string;
    region?: string;
  };
}
