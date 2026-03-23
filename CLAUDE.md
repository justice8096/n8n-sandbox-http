# n8n Sandbox HTTP

## Purpose
HTTP request utilities that work inside n8n's sandboxed Code node environment, where fetch(), axios, and URL are all unavailable or broken.

## Tools & Stack
- **Node.js** built-in http/https modules only
- Compatible with n8n 2.6+ Code node sandbox

## Directory Structure
```
src/
  index.js             — Main exports (httpRequest, httpPost, httpGet, httpPut, httpDelete)
  request.js           — Core request function using http/https
tests/
  request.test.js      — Request building and URL parsing tests
```

## Key Commands
```bash
npm test
```

## Why This Exists
n8n's Code node sandbox blocks:
- `fetch()` — not defined in the vm context
- `require('axios')` — crashes due to frozen FormData.prototype
- `new URL()` — not available in vm context
- `$helpers.httpRequest()` — not available in Code nodes

The `http`/`https` built-in modules work when `NODE_FUNCTION_ALLOW_BUILTIN=*` is set.

## Required n8n Environment
```cmd
set NODE_FUNCTION_ALLOW_BUILTIN=* && set NODE_FUNCTION_ALLOW_EXTERNAL=* && n8n start
```

## Technical Notes
- Manual URL parsing (regex-based, no URL constructor needed)
- JSON auto-parse on responses
- Works with both http and https
- No external dependencies — uses only Node.js built-ins
