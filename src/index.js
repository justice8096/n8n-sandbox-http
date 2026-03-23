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
  let path = '/';

  // Find the path (everything after first /)
  const pathIndex = remaining.indexOf('/');
  if (pathIndex !== -1) {
    hostname = remaining.slice(0, pathIndex);
    path = remaining.slice(pathIndex);
  }

  // Extract port from hostname
  if (hostname.includes(':')) {
    const [host, portStr] = hostname.split(':');
    hostname = host;
    port = parseInt(portStr, 10);
  }

  return { protocol, hostname, port, path, auth };
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
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = json ? JSON.parse(data) : data;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: result,
          });
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
      req.write(body);
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

module.exports = {
  httpRequest,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
  parseUrl,
};
