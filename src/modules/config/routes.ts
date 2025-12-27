/**
 * Config module routes
 * API endpoints for configuration distribution
 */

import { Elysia, t } from 'elysia';
import { successResponse, errorResponse, ErrorCodes } from '@/utils/response';
import { getNodeConfig, generateConfig, listTemplates, getTemplate } from './service';

export const configRoutes = new Elysia({ prefix: '/config' })
  // Get node configuration
  .get('/node/:nodeId/:configType', async ({ params, query }) => {
    try {
      const nodeId = Number(params.nodeId);
      const configType = params.configType as 'xray' | 'nginx';
      const { template } = query as { template?: string };

      if (configType !== 'xray' && configType !== 'nginx') {
        return errorResponse(ErrorCodes.INVALID_REQUEST, 'Invalid config type. Must be xray or nginx');
      }

      const { config, contentType } = await getNodeConfig(nodeId, configType, template);

      // Return as downloadable file
      return new Response(config, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="node-${nodeId}.${configType === 'xray' ? 'json' : 'conf'}"`,
        },
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return errorResponse(ErrorCodes.NODE_NOT_FOUND, error.message);
      }
      if (error.message.includes('Template not found')) {
        return errorResponse(ErrorCodes.TEMPLATE_NOT_FOUND, error.message);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get node config', error);
    }
  }, {
    detail: {
      tags: ['Config'],
      summary: 'Get node configuration',
      description: 'Download configuration file for a node (Xray or Nginx)',
    },
  })
  // Generate configuration (returns as JSON)
  .post('/generate', async ({ body }) => {
    try {
      const { nodeId, configType, template } = body as {
        nodeId: number;
        configType: 'xray' | 'nginx';
        template?: string;
      };

      const config = await generateConfig({ nodeId, configType, template });
      return successResponse({ config, configType });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return errorResponse(ErrorCodes.NODE_NOT_FOUND, error.message);
      }
      if (error.message.includes('Template not found')) {
        return errorResponse(ErrorCodes.TEMPLATE_NOT_FOUND, error.message);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to generate config', error);
    }
  }, {
    detail: {
      tags: ['Config'],
      summary: 'Generate configuration',
      description: 'Generate configuration for a node and return as JSON',
    },
    body: t.Object({
      nodeId: t.Integer(),
      configType: t.Union([t.Literal('xray'), t.Literal('nginx')]),
      template: t.Optional(t.String()),
    }),
  })
  // List available templates
  .get('/templates/:configType', async ({ params }) => {
    try {
      const configType = params.configType as 'xray' | 'nginx';

      if (configType !== 'xray' && configType !== 'nginx') {
        return errorResponse(ErrorCodes.INVALID_REQUEST, 'Invalid config type. Must be xray or nginx');
      }

      const templates = await listTemplates(configType);
      return successResponse({ templates, configType });
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to list templates', error);
    }
  }, {
    detail: {
      tags: ['Config'],
      summary: 'List templates',
      description: 'List available configuration templates',
    },
  })
  // Get template content
  .get('/templates/:configType/:templateName', async ({ params }) => {
    try {
      const configType = params.configType as 'xray' | 'nginx';
      const templateName = params.templateName;

      if (configType !== 'xray' && configType !== 'nginx') {
        return errorResponse(ErrorCodes.INVALID_REQUEST, 'Invalid config type. Must be xray or nginx');
      }

      const template = await getTemplate(configType, templateName);
      return successResponse(template);
    } catch (error: any) {
      if (error.message.includes('Template not found')) {
        return errorResponse(ErrorCodes.TEMPLATE_NOT_FOUND, error.message);
      }
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get template', error);
    }
  }, {
    detail: {
      tags: ['Config'],
      summary: 'Get template',
      description: 'Get template content and variables',
    },
  })
  // Reload templates (clear cache)
  .post('/templates/reload', async () => {
    try {
      const { reloadTemplates } = await import('./service');
      await reloadTemplates();
      return successResponse({ message: 'Templates reloaded successfully' });
    } catch (error) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to reload templates', error);
    }
  }, {
    detail: {
      tags: ['Config'],
      summary: 'Reload templates',
      description: 'Clear template cache and reload from disk',
    },
  });
