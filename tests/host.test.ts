/**
 * Host module tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { db, hosts } from '@/db';
import { eq } from 'drizzle-orm';
import { createHost, getHostById, getAllHosts, updateHost, deleteHost, processHeartbeat } from '@/modules/host/service';

describe('Host Module', () => {
  beforeAll(async () => {
    // Setup test database
    // In production, you'd use a separate test database
  });

  afterAll(async () => {
    // Cleanup
  });

  beforeEach(async () => {
    // Clean up test data before each test
  });

  describe('createHost', () => {
    it('should create a new host', async () => {
      const hostInfo = {
        name: 'test-host-1',
        ip: '192.168.1.1',
        cpuCores: 4,
        memoryTotal: 8192,
        diskTotal: 100,
      };

      const host = await createHost(hostInfo);

      expect(host).toBeDefined();
      expect(host.name).toBe(hostInfo.name);
      expect(host.ip).toBe(hostInfo.ip);
      expect(host.status).toBe('unknown');
    });

    it('should reject duplicate host names', async () => {
      const hostInfo = {
        name: 'test-host-duplicate',
        ip: '192.168.1.2',
        cpuCores: 2,
        memoryTotal: 4096,
        diskTotal: 50,
      };

      await createHost(hostInfo);

      await expect(createHost(hostInfo)).toThrow();
    });
  });

  describe('getHostById', () => {
    it('should retrieve host by ID', async () => {
      const hostInfo = {
        name: 'test-host-retrieve',
        ip: '192.168.1.3',
        cpuCores: 4,
        memoryTotal: 8192,
        diskTotal: 100,
      };

      const created = await createHost(hostInfo);
      const retrieved = await getHostById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(hostInfo.name);
    });

    it('should return null for non-existent host', async () => {
      const host = await getHostById(99999);
      expect(host).toBeNull();
    });
  });

  describe('processHeartbeat', () => {
    it('should create new host from heartbeat', async () => {
      const heartbeat = {
        name: 'test-host-heartbeat',
        cpuUsage: 45.5,
        memoryUsed: 4096,
        diskUsed: 50,
        uploadTotal: 1000000,
        downloadTotal: 2000000,
        uptime: 3600,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const host = await processHeartbeat(heartbeat);

      expect(host).toBeDefined();
      expect(host.name).toBe(heartbeat.name);
      expect(host.status).toBe('online');
    });

    it('should update existing host from heartbeat', async () => {
      const hostInfo = {
        name: 'test-host-update',
        ip: '192.168.1.4',
        cpuCores: 4,
        memoryTotal: 8192,
        diskTotal: 100,
      };

      const created = await createHost(hostInfo);

      const heartbeat = {
        name: 'test-host-update',
        cpuUsage: 75.5,
        memoryUsed: 6144,
        diskUsed: 80,
        uploadTotal: 5000000,
        downloadTotal: 10000000,
        uptime: 7200,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const updated = await processHeartbeat(heartbeat);

      expect(updated.cpuUsage).toBe(heartbeat.cpuUsage);
      expect(updated.status).toBe('online');
    });
  });

  describe('updateHost', () => {
    it('should update host information', async () => {
      const hostInfo = {
        name: 'test-host-update-info',
        ip: '192.168.1.5',
        cpuCores: 4,
        memoryTotal: 8192,
        diskTotal: 100,
      };

      const created = await createHost(hostInfo);

      const updated = await updateHost(created.id, {
        status: 'offline',
        cpuUsage: 0,
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('offline');
    });
  });

  describe('deleteHost', () => {
    it('should delete host', async () => {
      const hostInfo = {
        name: 'test-host-delete',
        ip: '192.168.1.6',
        cpuCores: 4,
        memoryTotal: 8192,
        diskTotal: 100,
      };

      const created = await createHost(hostInfo);
      const deleted = await deleteHost(created.id);

      expect(deleted).toBe(true);

      const retrieved = await getHostById(created.id);
      expect(retrieved).toBeNull();
    });
  });
});
