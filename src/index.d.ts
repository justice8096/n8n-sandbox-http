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
  method?: string;
  onData?: (chunk: Buffer) => void;
}

interface ParsedUrl {
  protocol: 'http' | 'https';
  hostname: string;
  port: number;
  path: string;
  auth: string | null;
}

interface FormDataField {
  filePath: string;
  fileName?: string;
}

interface FormData {
  [key: string]: string | FormDataField;
}

interface EncodedFormData {
  body: Buffer;
  contentType: string;
}

interface DownloadResponse {
  status: number;
  headers: Record<string, string | string[]>;
  path: string;
}

/**
 * Make a generic HTTP request.
 */
export function httpRequest(options: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | Buffer | null;
  json?: boolean;
  timeout?: number;
  onData?: (chunk: Buffer) => void;
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
 * Upload files and form data with multipart/form-data encoding.
 *
 * @example
 * const response = await httpUpload('https://example.com/upload', {
 *   document: { filePath: '/tmp/document.pdf', fileName: 'my-doc.pdf' },
 *   email: 'user@example.com',
 *   notes: 'Additional info'
 * });
 */
export function httpUpload<T = any>(
  url: string,
  formData: FormData,
  options?: HttpOptions,
): Promise<HttpResponse<T>>;

/**
 * Download a file from a URL and save it to disk.
 *
 * @example
 * const result = await httpDownload('https://example.com/file.pdf', '/tmp/file.pdf');
 */
export function httpDownload(
  url: string,
  destPath: string,
  options?: Omit<HttpOptions, 'json'>,
): Promise<DownloadResponse>;

/**
 * Stream response data with a callback function.
 * Useful for handling large responses without buffering in memory.
 *
 * @example
 * await httpStream('https://example.com/large.json', (chunk) => {
 *   console.log('Received', chunk.length, 'bytes');
 * });
 */
export function httpStream(
  url: string,
  onData: (chunk: Buffer) => void,
  options?: HttpOptions,
): Promise<HttpResponse<null>>;

/**
 * Parse a URL string into components.
 */
export function parseUrl(url: string): ParsedUrl;

/**
 * Encode form data as multipart/form-data body.
 * Used internally by httpUpload.
 */
export function encodeFormData(formData: FormData): EncodedFormData;

/**
 * Generate a multipart form-data boundary string.
 * Used internally by encodeFormData.
 */
export function generateBoundary(): string;
