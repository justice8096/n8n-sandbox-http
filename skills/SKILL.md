---
name: n8n-sandbox-http
description: Make HTTP requests from n8n Code nodes despite sandbox restrictions
version: 0.1.0
---

# n8n Sandbox HTTP Skill

Use this skill when the user is writing n8n Code nodes and encountering HTTP request issues due to sandbox restrictions (axios crashes, no fetch, no URL constructor).

## When to use
- User mentions "n8n Code node" and HTTP requests
- User gets errors like "Cannot redefine property: prototype" (axios crash)
- User asks why fetch or URL doesn't work in n8n Code nodes
- User needs to call external APIs from n8n Code nodes

## The problem
n8n's Code node sandbox restricts available APIs:
- **axios** crashes because n8n freezes `FormData.prototype` and axios tries to redefine it
- **fetch** is not available in the sandbox
- **URL constructor** is not available
- Only `require('http')` and `require('https')` work reliably

## How to use

```javascript
// In an n8n Code node:
const { httpGet, httpPost, httpRequest } = require('n8n-sandbox-http');

// GET request
const data = await httpGet('http://localhost:8188/history');

// POST with JSON body
const result = await httpPost('http://localhost:8188/prompt', {
  prompt: workflowJson
});

// Custom request
const response = await httpRequest({
  method: 'PUT',
  url: 'http://api.example.com/data',
  headers: { 'Authorization': 'Bearer token' },
  body: JSON.stringify(payload)
});
```

## Key behaviors
- Uses raw `require('http')`/`require('https')` internally — no axios, no fetch
- Manual URL parsing (no URL constructor dependency)
- Handles JSON parsing automatically
- Supports custom headers, request bodies, and all HTTP methods
- Works reliably inside n8n's frozen-prototype sandbox
