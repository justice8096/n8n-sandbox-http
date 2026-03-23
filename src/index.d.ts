/**
 * TypeScript declarations for n8n-sandbox-http.
 */

interface HttpResponse<T = any> {
  status: number;
  headers: Record<string, string | string[]>;
  data: T;
}

interface HttpOptions {
  headers?: Record<string, string>;
  json?: boolean;
  timeout?: number;
}

interface ParsedUrl {
  protocol: 'http' | 'https';
  hostname: string;
  port: number;
  path: string;
  auth: string | null;
}

/**
 * Make a generic HTTP request.
 */
export function httpRequest(options: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | null;
  json?: boolean;
  timeout?: number;
}): Promise<HttpResponse>;

/**
 * Make a GET request.
 */
export function httpGet<T = string>(
  url: string,
  options?: HttpOptions,
): Promise<HttpResponse<T>>;

/**
 * Make a POST request.
 */
export function httpPost<T = any>(
  url: string,
  body: string | Record<string, any>,
  options?: HttpOptions,
): Promise<HttpResponse<T>>;

/**
 * Make a PUT request.
 */
export function httpPut<T = any>(
  url: string,
  body: string | Record<string, any>,
  options?: HttpOptions,
): Promise<HttpResponse<T>>;

/**
 * Make a DELETE request.
 */
export function httpDelete<T = any>(
  url: string,
  options?: HttpOptions,
): Promise<HttpResponse<T>>;

/**
 * Parse a URL string into components.
 */
export function parseUrl(url: string): ParsedUrl;
