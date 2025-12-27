/**
 * Standard API response wrapper
 * All API endpoints should return responses in this format
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: unknown
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // General errors (1xxx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Host errors (2xxx)
  HOST_NOT_FOUND: 'HOST_NOT_FOUND',
  HOST_ALREADY_EXISTS: 'HOST_ALREADY_EXISTS',
  HOST_OFFLINE: 'HOST_OFFLINE',

  // Node errors (3xxx)
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  NODE_ALREADY_EXISTS: 'NODE_ALREADY_EXISTS',
  NODE_INVALID_CONFIG: 'NODE_INVALID_CONFIG',
  NODE_ASSOCIATION_FAILED: 'NODE_ASSOCIATION_FAILED',

  // Config errors (4xxx)
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  TEMPLATE_INVALID: 'TEMPLATE_INVALID',

  // DNS errors (5xxx)
  DNS_UPDATE_FAILED: 'DNS_UPDATE_FAILED',
  DNS_PROVIDER_ERROR: 'DNS_PROVIDER_ERROR',

  // Panel errors (6xxx)
  PANEL_CONNECTION_FAILED: 'PANEL_CONNECTION_FAILED',
  PANEL_API_ERROR: 'PANEL_API_ERROR',
  PANEL_SYNC_FAILED: 'PANEL_SYNC_FAILED',
} as const;
