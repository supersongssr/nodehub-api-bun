/**
 * Node module tests
 */

import { describe, it, expect } from 'bun:test';
import { createNode, getNodeById, updateNode, deleteNode, linkNodeToHost } from '@/modules/node/service';
import { createHost } from '@/modules/host/service';

describe('Node Module', () => {
  describe('createNode', () => {
    it('should create a new node', async () => {
      const nodeInfo = {
        panelType: 'ssp' as const,
        panelNodeId: 1,
        panelUrl: 'https://ssp.example.com',
        name: 'test-node-1',
        port: 8388,
        proxyType: 'shadowsocks',
      };

      const node = await createNode(nodeInfo);

      expect(node).toBeDefined();
      expect(node.name).toBe(nodeInfo.name);
      expect(node.panelType).toBe(nodeInfo.panelType);
      expect(node.isActive).toBe(true);
    });
  });

  describe('linkNodeToHost', () => {
    it('should link node to host', async () => {
      // Create host
      const hostInfo = {
        name: 'test-host-link',
        ip: '192.168.1.10',
        cpuCores: 4,
        memoryTotal: 8192,
        diskTotal: 100,
      };
      const host = await createHost(hostInfo);

      // Create node
      const nodeInfo = {
        panelType: 'ssp' as const,
        panelNodeId: 2,
        panelUrl: 'https://ssp.example.com',
        name: 'test-node-link',
        port: 8389,
        proxyType: 'shadowsocks',
      };
      const node = await createNode(nodeInfo);

      // Link
      const linked = await linkNodeToHost(node.id, host.id);

      expect(linked).toBeDefined();
      expect(linked.hostId).toBe(host.id);
    });

    it('should fail with invalid host ID', async () => {
      const nodeInfo = {
        panelType: 'ssp' as const,
        panelNodeId: 3,
        panelUrl: 'https://ssp.example.com',
        name: 'test-node-invalid-host',
        port: 8390,
        proxyType: 'shadowsocks',
      };
      const node = await createNode(nodeInfo);

      await expect(linkNodeToHost(node.id, 99999)).toThrow();
    });
  });

  describe('updateNode', () => {
    it('should update node information', async () => {
      const nodeInfo = {
        panelType: 'ssp' as const,
        panelNodeId: 4,
        panelUrl: 'https://ssp.example.com',
        name: 'test-node-update',
        port: 8391,
        proxyType: 'shadowsocks',
      };
      const created = await createNode(nodeInfo);

      const updated = await updateNode(created.id, {
        name: 'test-node-updated',
        domain: 'example.com',
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('test-node-updated');
      expect(updated?.domain).toBe('example.com');
    });
  });

  describe('deleteNode', () => {
    it('should delete node', async () => {
      const nodeInfo = {
        panelType: 'ssp' as const,
        panelNodeId: 5,
        panelUrl: 'https://ssp.example.com',
        name: 'test-node-delete',
        port: 8392,
        proxyType: 'shadowsocks',
      };
      const created = await createNode(nodeInfo);

      const deleted = await deleteNode(created.id);

      expect(deleted).toBe(true);

      const retrieved = await getNodeById(created.id);
      expect(retrieved).toBeNull();
    });
  });
});
