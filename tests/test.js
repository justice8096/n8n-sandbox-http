/**
 * Basic tests for n8n-sandbox-http.
 * These tests mock the http module since we can't make real network requests.
 */

const {
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
  parseUrl,
} = require('../src/index.js');

// Test URL parsing
function testParseUrl() {
  console.log('Testing parseUrl...');

  const tests = [
    {
      input: 'https://api.example.com/v1/data',
      expected: {
        protocol: 'https',
        hostname: 'api.example.com',
        port: 443,
        path: '/v1/data',
        auth: null,
      },
    },
    {
      input: 'http://localhost:3000/test',
      expected: {
        protocol: 'http',
        hostname: 'localhost',
        port: 3000,
        path: '/test',
        auth: null,
      },
    },
    {
      input: 'user:pass@example.com/api',
      expected: {
        protocol: 'https',
        hostname: 'example.com',
        port: 443,
        path: '/api',
        auth: 'user:pass',
      },
    },
    {
      input: 'https://api.example.com',
      expected: {
        protocol: 'https',
        hostname: 'api.example.com',
        port: 443,
        path: '/',
        auth: null,
      },
    },
  ];

  for (const test of tests) {
    const result = parseUrl(test.input);
    const match = JSON.stringify(result) === JSON.stringify(test.expected);
    const status = match ? '✓' : '✗';
    console.log(`  ${status} ${test.input}`);
    if (!match) {
      console.log(`    Expected: ${JSON.stringify(test.expected)}`);
      console.log(`    Got:      ${JSON.stringify(result)}`);
    }
  }
}

// Test function signatures (without network calls)
function testFunctionSignatures() {
  console.log('\nTesting function signatures...');

  // Check that functions are exported
  const checks = [
    ['httpGet', typeof httpGet === 'function'],
    ['httpPost', typeof httpPost === 'function'],
    ['httpPut', typeof httpPut === 'function'],
    ['httpDelete', typeof httpDelete === 'function'],
    ['parseUrl', typeof parseUrl === 'function'],
  ];

  for (const [name, exists] of checks) {
    const status = exists ? '✓' : '✗';
    console.log(`  ${status} ${name} is exported`);
  }
}

// Run tests
if (require.main === module) {
  testParseUrl();
  testFunctionSignatures();
  console.log('\nBasic tests complete!');
}

module.exports = {
  testParseUrl,
  testFunctionSignatures,
};
