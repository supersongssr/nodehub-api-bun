/**
 * Config module service
 * Handles configuration file generation and distribution
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import { db, nodes, hosts } from '@/db';
import { eq } from 'drizzle-orm';
import { createLogger } from '@/utils/logger';
import type { ConfigRequest, ConfigTemplate, NodeConfigContext } from './model';

const logger = createLogger('ConfigService');

// Template cache
const templateCache = new Map<string, string>();

/**
 * Load template file
 */
async function loadTemplate(configType: 'xray' | 'nginx', templateName?: string): Promise<string> {
  const templateNameSafe = templateName || 'default';
  const cacheKey = `${configType}:${templateNameSafe}`;

  // Check cache first
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  try {
    const templateDir = resolve(process.cwd(), 'templates', configType);
    const templatePath = resolve(templateDir, `${templateNameSafe}.${configType === 'xray' ? 'json' : 'conf'}`);

    const content = await fs.readFile(templatePath, 'utf-8');

    // Cache the template
    templateCache.set(cacheKey, content);

    logger.debug(`Loaded template: ${cacheKey}`);
    return content;
  } catch (error) {
    logger.error(`Failed to load template: ${configType}/${templateNameSafe}`, { error });
    throw new Error(`Template not found: ${configType}/${templateNameSafe}`);
  }
}

/**
 * Reload all templates (clears cache)
 */
export async function reloadTemplates(): Promise<void> {
  templateCache.clear();
  logger.info('Template cache cleared');
}

/**
 * Get node configuration context
 */
async function getNodeContext(nodeId: number): Promise<NodeConfigContext> {
  const node = await db.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1);
  if (!node[0]) {
    throw new Error(`Node with ID ${nodeId} not found`);
  }

  const nodeData = node[0];

  let hostContext = undefined;
  if (nodeData.hostId) {
    const host = await db.select().from(hosts).where(eq(hosts.id, nodeData.hostId)).limit(1);
    if (host[0]) {
      hostContext = {
        ip: host[0].ip,
        ipv6: host[0].ipv6 || undefined,
        region: host[0].region || undefined,
      };
    }
  }

  // Parse additional ports
  const additionalPorts = nodeData.additionalPorts
    ? nodeData.additionalPorts.split(',').map((p) => parseInt(p.trim()))
    : [];

  // Parse proxy config
  let proxyConfig = {};
  if (nodeData.proxyConfig) {
    try {
      proxyConfig = JSON.parse(nodeData.proxyConfig);
    } catch (error) {
      logger.warn(`Failed to parse proxy config for node ${nodeId}`, { error });
    }
  }

  return {
    id: nodeData.id,
    name: nodeData.name,
    domain: nodeData.domain || '',
    port: nodeData.port,
    additionalPorts,
    proxyType: nodeData.proxyType,
    proxyConfig,
    host: hostContext,
  };
}

/**
 * Replace template variables
 */
function replaceVariables(template: string, context: NodeConfigContext): string {
  let result = template;

  // Define variable replacements
  const replacements: Record<string, string> = {
    // Node variables
    '{{NODE_ID}}': String(context.id),
    '{{NODE_NAME}}': context.name,
    '{{DOMAIN}}': context.domain,
    '{{PORT}}': String(context.port),
    '{{PROXY_TYPE}}': context.proxyType,

    // Host variables
    '{{HOST_IP}}': context.host?.ip || '',
    '{{HOST_IPV6}}': context.host?.ipv6 || '',
    '{{HOST_REGION}}': context.host?.region || '',

    // Additional ports
    '{{ADDITIONAL_PORTS}}': context.additionalPorts.join(','),
  };

  // Replace all variables
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }

  return result;
}

/**
 * Generate configuration for a node
 */
export async function generateConfig(request: ConfigRequest): Promise<string> {
  try {
    // Load template
    const template = await loadTemplate(request.configType, request.template);

    // Get node context
    const context = await getNodeContext(request.nodeId);

    // Replace variables
    const config = replaceVariables(template, context);

    logger.info(`Generated ${request.configType} config for node ${request.nodeId}`);
    return config;
  } catch (error) {
    logger.error(`Failed to generate config for node ${request.nodeId}`, { error });
    throw error;
  }
}

/**
 * Get configuration for a node (API handler)
 */
export async function getNodeConfig(nodeId: number, configType: 'xray' | 'nginx', template?: string): Promise<{
  config: string;
  contentType: string;
}> {
  try {
    const config = await generateConfig({ nodeId, configType, template });
    const contentType = configType === 'xray' ? 'application/json' : 'text/plain';

    return { config, contentType };
  } catch (error) {
    logger.error(`Failed to get config for node ${nodeId}`, { error });
    throw error;
  }
}

/**
 * List available templates
 */
export async function listTemplates(configType: 'xray' | 'nginx'): Promise<string[]> {
  try {
    const templateDir = resolve(process.cwd(), 'templates', configType);
    const files = await fs.readdir(templateDir);

    const templates = files
      .filter((f) => f.endsWith(configType === 'xray' ? '.json' : '.conf'))
      .map((f) => f.replace(configType === 'xray' ? '.json' : '.conf', ''));

    return templates;
  } catch (error) {
    logger.error(`Failed to list templates for ${configType}`, { error });
    return [];
  }
}

/**
 * Get template content
 */
export async function getTemplate(configType: 'xray' | 'nginx', templateName: string): Promise<ConfigTemplate> {
  try {
    const content = await loadTemplate(configType, templateName);

    // Extract variables (simple {{VAR}} pattern matching)
    const variableRegex = /\{\{([A-Z_]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return {
      name: templateName,
      type: configType,
      content,
      variables: Array.from(variables),
    };
  } catch (error) {
    logger.error(`Failed to get template ${templateName}`, { error });
    throw error;
  }
}
