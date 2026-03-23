# n8n Sandbox HTTP

Lightweight HTTP utility for n8n Code nodes using only Node.js built-in modules. Works reliably inside n8n's frozen VM sandbox.

## Why This Exists

When running custom code inside n8n Code nodes, you're constrained by the VM sandbox:

- **axios crashes** — n8n freezes `FormData.prototype`, breaking axios completely
- **fetch() unavailable** — Not available in the vm context
- **URL constructor unavailable** — No access to the native URL parsing API
- **This module uses only built-ins** — `require('http')` and `require('https')` with manual URL parsing and form encoding

This module provides a drop-in HTTP client that works reliably inside n8n without external dependencies.

## Installation

Install via npm:

```bash
npm install n8n-sandbox-http
```

Or copy `src/index.js` directly into your n8n project.

## n8n Startup Configuration

To use this module in n8n Code nodes, start n8n with:

```bash
NODE_FUNCTION_ALLOW_BUILTIN=* n8n start
```

This allows Code nodes to require built-in modules like `http` and `https`.

## n8n Sandbox Restrictions & Workarounds

### What Works
- ✓ Making HTTP/HTTPS requests
- ✓ Sending JSON bodies
- ✓ Uploading files with multipart/form-data
- ✓ Streaming large responses
- ✓ Custom headers and authentication
- ✓ Basic auth with embedded credentials

### What Doesn't Work (and why)
- ✗ **External npm packages** — Most will fail due to frozen prototypes (FormData, Promise.resolve, etc.)
- ✗ **Native URL/URLSearchParams** — URL constructor is unavailable in the VM
- ✗ **fs module** — File operations have strict sandboxing
- ✗ **Cookies/Sessions** — No persistence across requests
- ✗ **Redirects** — Automatic redirect following not implemented

### Workarounds

**For packages:** Keep code simple and use only built-ins. This library provides HTTP + form encoding.

**For file operations:** Use n8n's built-in file handling (Read Binary File, Write Binary File) instead of direct fs access.

**For redirects:** Check the status code in the response and follow manually if needed:

```javascript
const response = await httpGet(url);
if (response.status >= 300 && response.status < 400) {
  const redirectUrl = response.headers.location;
  return await httpGet(redirectUrl);
}
```

**For authentication:** Use headers directly. Cookies aren't stored between requests.

```javascript
const response = await httpPost(url, body, {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

## Usage

### Basic GET Request

```javascript
const { httpGet } = require('n8n-sandbox-http');

const response = await httpGet('https://api.example.com/users');
console.log(response.status);  // 200
console.log(response.data);    // Response body
```

### POST with JSON Body

```javascript
const { httpPost } = require('n8n-sandbox-http');

const response = await httpPost(
  'https://api.example.com/users',
  { name: 'Alice', email: 'alice@example.com' },
  { headers: { 'Authorization': 'Bearer token123' } }
);
console.log(response.data);
```

### POST with Form Data (multipart/form-data)

```javascript
const { httpUpload } = require('n8n-sandbox-http');

const response = await httpUpload('https://api.example.com/upload', {
  name: 'John Doe',
  email: 'john@example.com',
  document: {
    filePath: '/tmp/document.pdf',
    fileName: 'my-document.pdf'  // Optional, defaults to basename
  }
});
```

### PUT Request

```javascript
const { httpPut } = require('n8n-sandbox-http');

const response = await httpPut(
  'https://api.example.com/users/123',
  { name: 'Bob' }
);
```

### DELETE Request

```javascript
const { httpDelete } = require('n8n-sandbox-http');

const response = await httpDelete('https://api.example.com/users/123');
```

### Download a File

```javascript
const { httpDownload } = require('n8n-sandbox-http');

const result = await httpDownload(
  'https://example.com/file.pdf',
  '/tmp/downloaded.pdf'
);
console.log(result.path);  // /tmp/downloaded.pdf
```

### Stream Large Responses

```javascript
const { httpStream } = require('n8n-sandbox-http');

const chunks = [];
await httpStream('https://api.example.com/large-data.json', (chunk) => {
  chunks.push(chunk);
  console.log('Received', chunk.length, 'bytes');
});

const data = Buffer.concat(chunks).toString();
```

### Generic Request with Custom Options

```javascript
const { httpRequest } = require('n8n-sandbox-http');

const response = await httpRequest({
  url: 'https://api.example.com/data',
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'active' }),
  timeout: 10000,
});
```

## API Reference

### `httpGet(url, options)`

Make a GET request.

**Parameters:**
- `url` (string): Full URL (http/https)
- `options` (object, optional):
  - `headers` (object): Custom headers
  - `json` (boolean): Auto-parse JSON response (default: false)
  - `timeout` (number): Request timeout in ms (default: 30000)

**Returns:** `Promise<HttpResponse>`

### `httpPost(url, body, options)`

Make a POST request.

**Parameters:**
- `url` (string): Full URL
- `body` (string or object): Request body (objects auto-stringified as JSON)
- `options` (object, optional): Same as httpGet

**Returns:** `Promise<HttpResponse>`

### `httpPut(url, body, options)`

Make a PUT request. Same signature as httpPost.

### `httpDelete(url, options)`

Make a DELETE request. Same signature as httpGet.

### `httpUpload(url, formData, options)`

Upload files and form data with multipart/form-data encoding.

**Parameters:**
- `url` (string): Full URL
- `formData` (object): Form fields
  - Text fields: `{ fieldName: 'text value' }`
  - File fields: `{ fieldName: { filePath: '/path/to/file', fileName: 'optional-name' } }`
- `options` (object, optional): Same as httpGet

**Returns:** `Promise<HttpResponse>`

**Example:**
```javascript
const response = await httpUpload('https://example.com/upload', {
  email: 'user@example.com',
  avatar: { filePath: '/tmp/avatar.jpg', fileName: 'avatar.jpg' },
  notes: 'User profile update'
});
```

### `httpDownload(url, destPath, options)`

Download a file from a URL and save it to disk.

**Parameters:**
- `url` (string): Full URL
- `destPath` (string): Destination file path
- `options` (object, optional): Same as httpGet (excluding `json`)

**Returns:** `Promise<{ status, headers, path }>`

**Example:**
```javascript
const result = await httpDownload(
  'https://example.com/file.pdf',
  '/tmp/file.pdf'
);
console.log('Saved to:', result.path);
```

### `httpStream(url, onData, options)`

Stream response data with a callback function. Useful for handling large responses without buffering in memory.

**Parameters:**
- `url` (string): Full URL
- `onData` (function): Callback called for each chunk: `(chunk: Buffer) => void`
- `options` (object, optional): Same as httpGet

**Returns:** `Promise<HttpResponse>` (data field will be null)

**Example:**
```javascript
await httpStream('https://example.com/large.json', (chunk) => {
  console.log('Received', chunk.length, 'bytes');
  process.stdout.write(chunk);  // pipe to stdout
});
```

### `httpRequest(options)`

Generic HTTP request builder for advanced use cases.

**Parameters:**
- `options` (object):
  - `url` (string, required): Full URL
  - `method` (string): HTTP method (default: 'GET')
  - `headers` (object): Custom headers
  - `body` (string or Buffer): Request body
  - `json` (boolean): Auto-parse JSON response
  - `timeout` (number): Timeout in ms
  - `onData` (function): Streaming callback

**Returns:** `Promise<HttpResponse>`

### `parseUrl(url)`

Parse a URL string into components (protocol, hostname, port, path, auth).

**Returns:**
```javascript
{
  protocol: 'https' | 'http',
  hostname: string,
  port: number,
  path: string,
  auth: string | null
}
```

### Response Object

```javascript
{
  status: number,      // HTTP status code (200, 404, 500, etc.)
  headers: object,     // Response headers (case-insensitive keys)
  data: string|object  // Response body (parsed if json: true)
}
```

## Example: Complete REST API Workflow

```javascript
const { httpPost, httpGet, httpPut, httpDelete } = require('n8n-sandbox-http');

// Create
const createResponse = await httpPost(
  'https://api.example.com/items',
  { name: 'New Item', description: 'A test item' },
  { headers: { 'Authorization': 'Bearer token' } }
);
const itemId = createResponse.data.id;

// Read
const getResponse = await httpGet(
  `https://api.example.com/items/${itemId}`,
  { json: true, headers: { 'Authorization': 'Bearer token' } }
);
console.log('Item:', getResponse.data);

// Update
const updateResponse = await httpPut(
  `https://api.example.com/items/${itemId}`,
  { name: 'Updated Item' },
  { headers: { 'Authorization': 'Bearer token' } }
);

// Delete
await httpDelete(
  `https://api.example.com/items/${itemId}`,
  { headers: { 'Authorization': 'Bearer token' } }
);
```

## Error Handling

All functions reject with an Error if the request fails:

```javascript
try {
  const response = await httpGet('https://api.example.com/data');
  console.log(response.data);
} catch (error) {
  console.error('Request failed:', error.message);
  // Handle: timeout, connection error, invalid response, etc.
}
```

Common errors:
- `Request timeout after 30000ms` — Server didn't respond in time
- `HTTP 404` — Endpoint not found
- `Failed to parse response` — Response wasn't valid JSON (when json: true)

## Limitations

- No automatic redirects (manually follow if needed)
- No cookie jar / session management
- No built-in retry logic
- No proxy support
- No SOCKS/tunnel support
- Responses buffered in memory (use `httpStream` for large files)

For complex scenarios, consider:
1. Using n8n's HTTP Request node instead
2. Moving logic to a Code node that runs on the server (not inside a Code node)
3. Calling an HTTP webhook you control instead of making direct requests

## Testing

Run the test suite:

```bash
npm test
```

Tests verify:
- URL parsing (protocols, ports, auth, query strings)
- Form data encoding (text fields, files, multipart boundaries)
- Function signatures and exports
- Error handling
- Response object shape

## License

MIT © 2026 Justice E. Chase

## Support

For issues, questions, or feature requests: [Open an issue](https://github.com/yourusername/n8n-sandbox-http)
