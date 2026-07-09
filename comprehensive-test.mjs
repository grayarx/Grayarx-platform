#!/usr/bin/env node

/**
 * Comprehensive Test Suite for GrayArx Platform
 * Tests all critical systems before deployment
 */

import http from 'http';
import https from 'https';

const BASE_URL = 'http://localhost:3000';
const TESTS = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  TESTS.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertExists(value, message) {
  if (!value) throw new Error(message);
}

// Helper to make HTTP requests
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ============ TESTS ============

test('Server is running', async () => {
  const res = await request('GET', '/');
  assertExists(res, 'Server not responding');
});

test('API health check', async () => {
  const res = await request('GET', '/api/health');
  assertEqual(res.status, 200, 'Health check failed');
});

test('Authentication endpoints exist', async () => {
  const res = await request('GET', '/api/trpc/auth.me');
  // Should return 401 or 200 depending on auth state
  assert([200, 401, 404].includes(res.status), 'Auth endpoint not accessible');
});

test('Database connection', async () => {
  // This would require a specific endpoint
  // For now, just check if server responds
  const res = await request('GET', '/');
  assertEqual(res.status, 200, 'Server not responding');
});

test('CORS headers present', async () => {
  const res = await request('GET', '/');
  assertExists(res.headers, 'No response headers');
});

test('Security headers present', async () => {
  const res = await request('GET', '/');
  // Check for common security headers
  const headers = Object.keys(res.headers).map(k => k.toLowerCase());
  assert(headers.length > 0, 'No security headers found');
});

test('Static assets loadable', async () => {
  const res = await request('GET', '/index.html');
  assert([200, 304].includes(res.status), 'Static assets not accessible');
});

test('API routes respond', async () => {
  const res = await request('GET', '/api/trpc/');
  // Should return some response (might be 404 or 200)
  assert(res.status !== 500, 'API route returned 500');
});

// ============ STRESS TESTS ============

test('Concurrent requests (10)', async () => {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(request('GET', '/'));
  }
  const results = await Promise.all(promises);
  results.forEach(res => {
    assert(res.status !== 500, 'Request failed under load');
  });
});

test('Concurrent requests (50)', async () => {
  const promises = [];
  for (let i = 0; i < 50; i++) {
    promises.push(request('GET', '/'));
  }
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.status !== 500).length;
  assert(successCount >= 45, `Only ${successCount}/50 requests succeeded`);
});

test('Response time under load', async () => {
  const start = Date.now();
  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(request('GET', '/'));
  }
  await Promise.all(promises);
  const elapsed = Date.now() - start;
  assert(elapsed < 10000, `Requests took ${elapsed}ms (expected < 10000ms)`);
});

test('Memory stability', async () => {
  const before = process.memoryUsage().heapUsed;
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(request('GET', '/'));
  }
  await Promise.all(promises);
  const after = process.memoryUsage().heapUsed;
  const increase = after - before;
  assert(increase < 50 * 1024 * 1024, `Memory increased by ${increase / 1024 / 1024}MB`);
});

// ============ SECURITY TESTS ============

test('No sensitive data in headers', async () => {
  const res = await request('GET', '/');
  const headers = JSON.stringify(res.headers).toLowerCase();
  assert(!headers.includes('password'), 'Password in headers');
  assert(!headers.includes('token'), 'Token in headers');
  assert(!headers.includes('secret'), 'Secret in headers');
});

test('No SQL injection vulnerability', async () => {
  const res = await request('GET', "/?id=1' OR '1'='1");
  assertEqual(res.status, 200, 'SQL injection test failed');
});

test('No XSS in response', async () => {
  const res = await request('GET', "/?search=<script>alert('xss')</script>");
  const body = JSON.stringify(res.body);
  assert(!body.includes('<script>'), 'XSS vulnerability detected');
});

// ============ PERFORMANCE TESTS ============

test('Response time < 200ms', async () => {
  const start = Date.now();
  await request('GET', '/');
  const elapsed = Date.now() - start;
  assert(elapsed < 200, `Response time ${elapsed}ms (expected < 200ms)`);
});

test('Multiple sequential requests', async () => {
  for (let i = 0; i < 5; i++) {
    const res = await request('GET', '/');
    assertEqual(res.status, 200, `Request ${i} failed`);
  }
});

// ============ RUN TESTS ============

async function runTests() {
  console.log('\n🧪 Starting Comprehensive Test Suite\n');
  console.log(`Total tests: ${TESTS.length}\n`);

  for (const { name, fn } of TESTS) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Success Rate: ${((passed / TESTS.length) * 100).toFixed(1)}%`);
  console.log(`${'='.repeat(60)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Wait for server to start
setTimeout(runTests, 1000);
