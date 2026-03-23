# n8n Sandbox HTTP

HTTP utility for n8n Code nodes using only Node.js built-in modules.

## Why This Exists

When running custom code inside n8n Code nodes, you're constrained by the VM sandbox:

- **axios crashes** — n8n freezes `FormData.prototype`, breaking axios
- **fetch() unavailable** — Not available in the vm context
- **URL constructor unavailable** — No access to the native URL parsing API
- **This module uses only built-ins** — `require('http')` and `require('https')` with manual URL parsing

This module provides a drop-in HTTP client that works reliably inside n8n.

## Installation

Copy `src/index.js` into your n8n project, or install via npm:

```bash
npm install n8n-sandbox-http
```

## n8n Startup Configuration

To use this module in n8n Code nodes, start n8n with:

```bash
NODE_FUNCTION_ALLOW_BUILTIN=* n8n start
```

This allows Code nodes to require built-in modules like `http` and `https`.

## Usage in n8n Code Nodes

### Basic GET request

```javascript
const { httpGet } = require('n8n-sandbox-http');

const response = await httpGet('https://api.example.com/users');
console.log(response.status);  // 200
console.log(response.data);    // Response body
```

### POST with JSON body

```javascript
const { httpPost } = require('n8n-sandbox-http');

const response = await httpPost(
  'https://api.example.com/users',
  { name: 'Alice', email: 'alice@example.com' },
  { headers: { 'Authorization': 'Bearer token123' } }
);
console.log(response.data);
```

### PUT request

```javascript
const { httpPut } = require('n8n-sandbox-http');

const response = await httpPut(
  'https://api.example.com/users/123',
  { name: 'Bob' }
);
```

### DELETE request

```javascript
const { httpDelete } = require('n8n-sandbox-http');

const response = await httpDelete('https://api.example.com/users/123');
```

### Generic request with custom options

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

**Returns:** Promise<HttpResponse>

### `httpPost(url, body, options)`

Make a POST request.

**Parameters:**
- `url` (string): Full URL
- `body` (string or object): Request body (objects auto-stringified as JSON)
- `options` (object, optional): Same as httpGet

**Returns:** Promise<HttpResponse>

### `httpPut(url, body, options)`

Make a PUT request. Same signature as httpPost.

### `httpDelete(url, options)`

Make a DELETE request. Same signature as httpGet.

### `httpRequest(options)`

Generic HTTP request builder.

**Parameters:**
- `options` (object):
  - `url` (string, required): Full URL
  - `method` (string): HTTP method (default: 'GET')
  - `headers` (object): Custom headers
  - `body` (string): Request body
  - `json` (boolean): Auto-parse JSON
  - `timeout` (number): Timeout in ms

**Returns:** Promise<HttpResponse>

### Response Object

```javascript
{
  status: number,      // HTTP status code
  headers: object,     // Response headers
  data: string|object  // Response body (parsed if json: true)
}
```

## Example: Calling a REST API

```javascript
const { httpPost, httpGet } = require('n8n-sandbox-http');

// Create a resource
const createResponse = await httpPost(
  'https://api.example.com/items',
  {
    name: 'New Item',
    description: 'A test item'
  }
);

const itemId = createResponse.data.id;

// Fetch it back
const getResponse = await httpGet(
  `https://api.example.com/items/${itemId}`,
  { json: true }
);

console.log(getResponse.data);
```

## Error Handling

All functions reject with an Error if the request fails:

```javascript
try {
  const response = await httpGet('https://api.example.com/data');
} catch (error) {
  console.error('Request failed:', error.message);
}
```

## Limitations

- No automatic redirects (manually follow if needed)
- No cookie jar / session management
- No built-in retry logic
- No proxy support
- No streaming support (full response buffered in memory)

For complex scenarios, consider moving logic to a Code node that runs on the n8n server (not inside a Code node).

## License

MIT © 2026 Justice
