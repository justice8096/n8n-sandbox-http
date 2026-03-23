/**
 * Comprehensive test suite for n8n-sandbox-http.
 * Tests URL parsing, form-data encoding, and function signatures.
 */

const {
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
} = require('../src/index.js');

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

// Test helper
function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
    return false;
  }
  console.log(`  ✓ PASS: ${message}`);
  testsPassed++;
  return true;
}

// Test: URL parsing
function testParseUrl() {
  console.log('\n=== Testing parseUrl ===');

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
    {
      input: 'http://example.com:8080/path?query=1',
      expected: {
        protocol: 'http',
        hostname: 'example.com',
        port: 8080,
        path: '/path?query=1',
        auth: null,
      },
    },
    {
      input: 'https://user:password123@api.example.com:9000/v2/resources',
      expected: {
        protocol: 'https',
        hostname: 'api.example.com',
        port: 9000,
        path: '/v2/resources',
        auth: 'user:password123',
      },
    },
  ];

  for (const test of tests) {
    const result = parseUrl(test.input);
    const match = JSON.stringify(result) === JSON.stringify(test.expected);
    if (match) {
      assert(true, `parseUrl('${test.input}')`);
    } else {
      console.error(`  ✗ FAIL: parseUrl('${test.input}')`);
      console.error(`    Expected: ${JSON.stringify(test.expected)}`);
      console.error(`    Got:      ${JSON.stringify(result)}`);
      testsFailed++;
    }
  }
}

// Test: Form data encoding
function testEncodeFormData() {
  console.log('\n=== Testing encodeFormData ===');

  // Test 1: Text fields only
  const textForm = {
    name: 'John Doe',
    email: 'john@example.com',
  };

  const encoded1 = encodeFormData(textForm);
  assert(Buffer.isBuffer(encoded1.body), 'Returns body as Buffer');
  assert(
    encoded1.contentType.startsWith('multipart/form-data; boundary='),
    'Returns correct Content-Type'
  );
  assert(encoded1.body.toString().includes('John Doe'), 'Body contains form data');

  // Test 2: Boundary generation
  const boundary1 = generateBoundary();
  const boundary2 = generateBoundary();
  assert(boundary1.length > 20, 'Boundary has minimum length');
  assert(boundary1 !== boundary2, 'Each boundary is unique');

  // Test 3: Form data with special characters
  const specialForm = {
    field1: 'value with spaces',
    field2: 'value@with#special$chars',
  };

  const encoded2 = encodeFormData(specialForm);
  assert(encoded2.body.length > 0, 'Handles special characters in form data');
}

// Test: Function signatures
function testFunctionSignatures() {
  console.log('\n=== Testing function signatures ===');

  const checks = [
    ['httpGet', typeof httpGet === 'function'],
    ['httpPost', typeof httpPost === 'function'],
    ['httpPut', typeof httpPut === 'function'],
    ['httpDelete', typeof httpDelete === 'function'],
    ['httpUpload', typeof httpUpload === 'function'],
    ['httpDownload', typeof httpDownload === 'function'],
    ['httpStream', typeof httpStream === 'function'],
    ['parseUrl', typeof parseUrl === 'function'],
    ['encodeFormData', typeof encodeFormData === 'function'],
    ['generateBoundary', typeof generateBoundary === 'function'],
  ];

  for (const [name, exists] of checks) {
    assert(exists, `${name} is exported as function`);
  }
}

// Test: Response object shape
function testResponseShape() {
  console.log('\n=== Testing response object shape ===');

  // Verify that httpGet, httpPost, etc. return Promises
  const getPromise = httpGet('http://localhost:99999').catch(() => {});
  assert(getPromise instanceof Promise, 'httpGet returns a Promise');

  const postPromise = httpPost('http://localhost:99999', {}).catch(() => {});
  assert(postPromise instanceof Promise, 'httpPost returns a Promise');

  const putPromise = httpPut('http://localhost:99999', {}).catch(() => {});
  assert(putPromise instanceof Promise, 'httpPut returns a Promise');

  const deletePromise = httpDelete('http://localhost:99999').catch(() => {});
  assert(deletePromise instanceof Promise, 'httpDelete returns a Promise');

  const uploadPromise = httpUpload('http://localhost:99999', {}).catch(() => {});
  assert(uploadPromise instanceof Promise, 'httpUpload returns a Promise');

  const streamPromise = httpStream('http://localhost:99999', () => {}).catch(() => {});
  assert(streamPromise instanceof Promise, 'httpStream returns a Promise');
}

// Test: URL parsing edge cases
function testUrlParsingEdgeCases() {
  console.log('\n=== Testing URL parsing edge cases ===');

  // Root path
  const root = parseUrl('https://example.com');
  assert(root.path === '/', 'Root path defaults to /');

  // Port in hostname without path
  const portOnly = parseUrl('http://localhost:8080');
  assert(portOnly.port === 8080, 'Extracts port without path');
  assert(portOnly.hostname === 'localhost', 'Extracts hostname without path');

  // Query string preserved
  const query = parseUrl('https://example.com/api?key=value&foo=bar');
  assert(query.path === '/api?key=value&foo=bar', 'Query string preserved in path');

  // Fragment preserved
  const fragment = parseUrl('https://example.com/page#section');
  assert(fragment.path === '/page#section', 'Fragment preserved in path');

  // Multiple slashes in path
  const multiSlash = parseUrl('https://example.com/api/v1/users/123');
  assert(multiSlash.path === '/api/v1/users/123', 'Multiple path segments handled');
}

// Test: Form data encoding with files
function testFormDataWithFiles() {
  console.log('\n=== Testing form data with files ===');

  // Create temporary test files
  const testDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testFile = path.join(testDir, 'test.txt');
  fs.writeFileSync(testFile, 'Test file content');

  try {
    const formData = {
      field1: 'text value',
      file: {
        filePath: testFile,
        fileName: 'myfile.txt',
      },
    };

    const encoded = encodeFormData(formData);
    assert(Buffer.isBuffer(encoded.body), 'Encodes form with files to Buffer');
    assert(
      encoded.body.toString('utf8').includes('Test file content'),
      'File content included in encoded body'
    );
    assert(encoded.contentType.includes('boundary='), 'Content-Type includes boundary');
  } finally {
    // Cleanup
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  }
}

// Test: Content-Type handling
function testContentTypeHandling() {
  console.log('\n=== Testing Content-Type handling ===');

  const formData = {
    name: 'Test',
    email: 'test@example.com',
  };

  // Encode once and reuse both contentType and body
  const encoded = encodeFormData(formData);
  const { contentType, body } = encoded;
  
  assert(
    contentType.startsWith('multipart/form-data;'),
    'Form data sets correct Content-Type prefix'
  );
  assert(contentType.includes('boundary='), 'Content-Type includes boundary parameter');

  // Verify boundary is in the body structure using the same encoded result
  const bodyString = body.toString('utf8');
  const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    assert(bodyString.includes(`--${boundary}`), 'Body uses same boundary from Content-Type');
  }
}

// Test: Module exports
function testModuleExports() {
  console.log('\n=== Testing module exports ===');

  const mod = require('../src/index.js');
  const exportedKeys = Object.keys(mod);

  assert(exportedKeys.includes('httpRequest'), 'httpRequest is exported');
  assert(exportedKeys.includes('httpGet'), 'httpGet is exported');
  assert(exportedKeys.includes('httpPost'), 'httpPost is exported');
  assert(exportedKeys.includes('httpPut'), 'httpPut is exported');
  assert(exportedKeys.includes('httpDelete'), 'httpDelete is exported');
  assert(exportedKeys.includes('httpUpload'), 'httpUpload is exported');
  assert(exportedKeys.includes('httpDownload'), 'httpDownload is exported');
  assert(exportedKeys.includes('httpStream'), 'httpStream is exported');
  assert(exportedKeys.includes('parseUrl'), 'parseUrl is exported');
  assert(exportedKeys.includes('encodeFormData'), 'encodeFormData is exported');
  assert(exportedKeys.includes('generateBoundary'), 'generateBoundary is exported');
}

// Run all tests
function runAllTests() {
  console.log('\n' + '='.repeat(50));
  console.log('n8n-sandbox-http Test Suite');
  console.log('='.repeat(50));

  testParseUrl();
  testEncodeFormData();
  testFunctionSignatures();
  testResponseShape();
  testUrlParsingEdgeCases();
  testFormDataWithFiles();
  testContentTypeHandling();
  testModuleExports();

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(50));

  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testParseUrl,
  testEncodeFormData,
  testFunctionSignatures,
  testResponseShape,
  testUrlParsingEdgeCases,
  testFormDataWithFiles,
  testContentTypeHandling,
  testModuleExports,
  runAllTests,
};
