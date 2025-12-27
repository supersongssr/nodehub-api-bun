/**
 * DNS module data models
 */

export interface DnsProvider {
  name: string;
  updateRecord(domain: string, type: string, value: string): Promise<boolean>;
  getRecord(domain: string, type: string): Promise<string | null>;
}

export interface DnsUpdateRequest {
  nodeId: number;
  domain: string;
  type: 'A' | 'AAAA' | 'CNAME';
  value: string;
}

export interface DnsCheckRequest {
  domain: string;
  expectedValue?: string;
}
