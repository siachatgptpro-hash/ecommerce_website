export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function friendlyStatusMessage(status: number, fallbackMessage: string): string {
  if (status === 429) return 'Too many attempts. Please wait a little and try again.';
  if (status >= 500) return 'The service is temporarily unavailable. Please try again in a moment.';
  return fallbackMessage;
}

/**
 * Reads an API response without assuming it is JSON. Deployment/platform
 * failures can legally return HTML; callers should receive a readable error,
 * never a raw `Unexpected token '<' ... is not valid JSON` parser message.
 */
export async function parseApiResponse<T = any>(
  response: Response,
  fallbackMessage = 'Something went wrong. Please try again.'
): Promise<T> {
  const text = await response.text().catch(() => '');
  let payload: any = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiRequestError(
      payload?.error?.message || friendlyStatusMessage(response.status, fallbackMessage),
      response.status,
      payload?.error?.code || (payload ? undefined : 'INVALID_RESPONSE'),
      payload?.error?.details
    );
  }

  if (payload === null) {
    if (response.status === 204) return null as T;
    throw new ApiRequestError(
      friendlyStatusMessage(response.status, 'The server returned an invalid response. Please try again.'),
      response.status,
      'INVALID_RESPONSE'
    );
  }

  return payload as T;
}

export async function fetchJson<T = any>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  fallbackMessage?: string
): Promise<T> {
  const response = await fetch(input, { credentials: 'include', ...init });
  return parseApiResponse<T>(response, fallbackMessage);
}

export function isAdminSessionError(error: unknown): error is ApiRequestError {
  return (
    error instanceof ApiRequestError &&
    (error.status === 401 ||
      error.code === 'ADMIN_ROLE_REQUIRED' ||
      error.code === 'SESSION_SCOPE_MISMATCH')
  );
}
