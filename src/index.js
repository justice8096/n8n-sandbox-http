/**
 * HTTP utility for n8n Code nodes.
 *
 * This module exports HTTP functions using only Node.js built-in http/https
 * modules. No axios, no fetch, no URL constructor — all to work safely inside
 * n8n Code nodes where the VM context is frozen.
 *
 * Why this exists:
 * - axios crashes n8n task runner (FormData.prototype is frozen)
 * - fetch() not available in vm context
 * - URL constructor not available in vm context
 * - This module uses only require('http')/require('https') with manual URL parsing
 *
 * n8n startup flags needed:
 *   NODE_FUNCTION_ALLOW_BUILTIN=*
 *
 * Usage in n8n Code node:
 *   const { httpGet, httpPost } = require('./n8n-sandbox-http');
 *   const result = await httpGet('https://api.example.com/data');
 *   console.log(result);
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Parse a URL string into components.
 * Handles http://, https://, and URLs without protocol (defaults to https).
 *
 * Returns: { protocol, hostname, port, path, auth }
 */
function parseUrl(urlString) {
  let protocol = 'https';
  let remaining = urlString;

  // Extract protocol if present
  if (urlString.startsWith('http://')) {
    protocol = 'http';
    remaining = urlString.slice(7);
  } else if (urlString.startsWith('https://')) {
    protocol = 'https';
    remaining = urlString.slice(8);
  }

  // Extract auth if present (user:pass@host)
  let auth = null;
  if (remaining.includes('@')) {
    const [authPart, hostPart] = remaining.split('@');
    auth = authPart;
    remaining = hostPart;
  }

  // Extract hostname and port
  let hostname = remaining;
  let port = protocol === 'https' ? 443 : 80;
  let pathStr = '/';

  // Find the path (everything after first /)
  const pathIndex = remaining.indexOf('/');
  if (pathIndex !== -1) {
    hostname = remaining.slice(0, pathIndex);
    pathStr = remaining.slice(pathIndex);
  }

  // Extract port from hostname
  if (hostname.includes(':')) {
    const [host, portStr] = hostname.split(':');
    hostname = host;
    port = parseInt(portStr, 10);
  }

  return { protocol, hostname, port, path: pathStr, auth };
}

/**
 * Generate a multipart form-data boundary.
 */
function generateBoundary() {
  return `----WebKitFormBoundary${Math.random().toString(36).substr(2, 16)}`;
}

/**
 * Encode form data as multipart/form-data body.
 * Supports text fields and file paths.
 *
 * formData: { fieldName: value, ... }
 *   - For text fields: value is a string
 *   - For files: value is { filePath: '/path/to/file', fieldName: 'file' }
 *
 * Returns: { body: Buffer, contentType: string }
 */
function encodeFormData(formData) {
  const boundary = generateBoundary();
  const lines = [];

  for (const [key, value] of Object.entries(formData)) {
    lines.push(`--${boundary}`);

    if (typeof value === 'string') {
      // Text field
      lines.push(`Content-Disposition: form-data; name="${key}"`);
      lines.push('');
      lines.push(value);
    } else if (value && typeof value === 'object' && value.filePath) {
      // File field
      const fileName = value.fileName || path.basename(value.filePath);
      lines.push(`Content-Disposition: form-data; name="${key}"; filename="${fileName}"`);
      lines.push('Content-Type: application/octet-stream');
      lines.push('');
      // Read file synchronously (n8n code nodes are not async at top level)
      const fileContent = fs.readFileSync(value.filePath);
      // We'll handle this specially below when building the buffer
    }
  }

  lines.push(`--${boundary}--`);
  lines.push('');

  // Build the body with file contents
  const parts = [];
  let formDataIndex = 0;
  const keys = Object.keys(formData);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = formData[key];

    // Add boundary
    parts.push(Buffer.from(`--${boundary}\r\n`));

    if (typeof value === 'string') {
      // Text field
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
      parts.push(Buffer.from(value));
      parts.push(Buffer.from('\r\n'));
    } else if (value && typeof value === 'object' && value.filePath) {
      // File field
      const fileName = value.fileName || path.basename(value.filePath);
      const fileContent = fs.readFileSync(value.filePath);
      parts.push(Buffer.from(
        `Content-Disposition: form-data; name="${key}"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`
      ));
      parts.push(fileContent);
      parts.push(Buffer.from('\r\n'));
    }
  }

  // Add final boundary
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(parts);
  const contentType = `multipart/form-data; boundary=${boundary}`;

  return { body, contentType };
}

/**
 * Make an HTTP request (generic).
 *
 * Returns: Promise resolving to response body (string or parsed JSON if json: true)
 */
function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      headers = {},
      body = null,
      json = false,
      timeout = 30000,
      onData = null,
    } = options;

    const parsed = parseUrl(url);
    const client = parsed.protocol === 'https' ? https : http;

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      method,
      headers,
      timeout,
    };

    if (parsed.auth) {
      reqOptions.headers = reqOptions.headers || {};
      reqOptions.headers.Authorization = `Basic ${Buffer.from(parsed.auth).toString('base64')}`;
    }

    const req = client.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        if (onData) {
          // Streaming mode: call callback for each chunk
          onData(chunk);
        } else {
          // Buffered mode: accumulate data
          data += chunk;
        }
      });

      res.on('end', () => {
        try {
          if (onData) {
            // Streaming mode: return response metadata only
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: null,
            });
          } else {
            // Buffered mode: parse data if needed
            const result = json ? JSON.parse(data) : data;
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: result,
            });
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    if (body) {
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.write(body);
      }
    }

    req.end();
  });
}

/**
 * Make a GET request.
 */
function httpGet(url, options = {}) {
  return httpRequest({
    ...options,
    url,
    method: 'GET',
  });
}

/**
 * Make a POST request.
 */
function httpPost(url, body, options = {}) {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  return httpRequest({
    ...options,
    url,
    method: 'POST',
    body: bodyStr,
    headers: {
      'Content-Type': options.headers?.['Content-Type'] || 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
      ...(options.headers || {}),
    },
  });
}

/**
 * Make a PUT request.
 */
function httpPut(url, body, options = {}) {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  return httpRequest({
    ...options,
    url,
    method: 'PUT',
    body: bodyStr,
    headers: {
      'Content-Type': options.headers?.['Content-Type'] || 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
      ...(options.headers || {}),
    },
  });
}

/**
 * Make a DELETE request.
 */
function httpDelete(url, options = {}) {
  return httpRequest({
    ...options,
    url,
    method: 'DELETE',
  });
}

/**
 * Upload files with form-data encoding.
 *
 * formData: Object with field names as keys
 *   - Text fields: { fieldName: 'text value' }
 *   - File fields: { fieldName: { filePath: '/path/to/file', fileName: 'optional-name' } }
 *
 * Example:
 *   const response = await httpUpload('https://example.com/upload', {
 *     document: { filePath: '/tmp/document.pdf', fileName: 'my-doc.pdf' },
 *     email: 'user@example.com',
 *     submit: 'true'
 *   });
 */
function httpUpload(url, formData, options = {}) {
  const { body, contentType } = encodeFormData(formData);

  return httpRequest({
    ...options,
    url,
    method: options.method || 'POST',
    body,
    headers: {
      ...options.headers,
      'Content-Type': contentType,
      'Content-Length': body.length,
    },
  });
}

/**
 * Download a file and save it to disk.
 *
 * Example:
 *   await httpDownload('https://example.com/file.pdf', '/tmp/downloaded.pdf');
 */
function httpDownload(url, destPath, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = parseUrl(url);
    const client = parsed.protocol === 'https' ? https : http;

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      method: 'GET',
      timeout: options.timeout || 30000,
    };

    if (parsed.auth) {
      reqOptions.headers = reqOptions.headers || {};
      reqOptions.headers.Authorization = `Basic ${Buffer.from(parsed.auth).toString('base64')}`;
    }

    const req = client.request(reqOptions, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(destPath);

      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve({
          status: res.statusCode,
          headers: res.headers,
          path: destPath,
        });
      });

      fileStream.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${options.timeout || 30000}ms`));
    });

    req.end();
  });
}

/**
 * Stream response data with a callback function.
 * Useful for handling large responses without buffering in memory.
 *
 * onData: Function(chunk) called for each data chunk
 *
 * Example:
 *   await httpStream('https://example.com/large.json', (chunk) => {
 *     console.log('Received', chunk.length, 'bytes');
 *   });
 */
function httpStream(url, onData, options = {}) {
  return httpRequest({
    ...options,
    url,
    method: options.method || 'GET',
    onData,
  });
}

module.exports = {
  httpRequest,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
  httpUpload,
  httpDownload,
  httpStream,
  parseUrl,
  encodeFormData,
  generateBoundary,
};
