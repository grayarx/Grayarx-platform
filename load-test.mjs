#!/usr/bin/env node

/**
 * Load Testing Script for GrayArx Authentication System
 * Tests signup, login, session management, and audit logging under load
 */

import http from "http";

const BASE_URL = "http://localhost:3000";
const CONCURRENT_USERS = 50;
const REQUESTS_PER_USER = 10;
const TEST_DURATION_MS = 30000; // 30 seconds

const results = new Map();
const metrics = [];

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const metric = { startTime };

    const options = {
      hostname: "localhost",
      port: 3000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        metric.endTime = Date.now();
        metric.statusCode = res.statusCode;
        metrics.push(metric);

        resolve({
          statusCode: res.statusCode || 500,
          data,
        });
      });
    });

    req.on("error", (error) => {
      metric.endTime = Date.now();
      metric.error = error.message;
      metrics.push(metric);

      reject(error);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

function recordResult(testName, success, responseTime, error) {
  if (!results.has(testName)) {
    results.set(testName, {
      name: testName,
      total: 0,
      success: 0,
      failed: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      errors: [],
    });
  }

  const result = results.get(testName);
  result.total++;

  if (success) {
    result.success++;
  } else {
    result.failed++;
    if (error && result.errors.length < 5) {
      result.errors.push(error);
    }
  }

  result.avgResponseTime =
    (result.avgResponseTime * (result.total - 1) + responseTime) / result.total;
  result.minResponseTime = Math.min(result.minResponseTime, responseTime);
  result.maxResponseTime = Math.max(result.maxResponseTime, responseTime);
}

async function testSignup(userId) {
  const testName = "Signup";
  const startTime = Date.now();

  try {
    const body = JSON.stringify({
      email: `user${userId}@test.com`,
      password: "SecurePass123!",
      name: `Test User ${userId}`,
      ipAddress: `192.168.${Math.floor(userId / 256)}.${userId % 256}`,
      userAgent: "LoadTest/1.0",
    });

    const response = await makeRequest("POST", "/api/trpc/oauth.signup", body);
    const responseTime = Date.now() - startTime;

    if (response.statusCode === 200 || response.statusCode === 201) {
      recordResult(testName, true, responseTime);
    } else {
      recordResult(testName, false, responseTime, `Status: ${response.statusCode}`);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordResult(
      testName,
      false,
      responseTime,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

async function testLogin(userId) {
  const testName = "Login";
  const startTime = Date.now();

  try {
    const body = JSON.stringify({
      email: `user${userId}@test.com`,
      password: "SecurePass123!",
      ipAddress: `192.168.${Math.floor(userId / 256)}.${userId % 256}`,
      userAgent: "LoadTest/1.0",
    });

    const response = await makeRequest("POST", "/api/trpc/oauth.login", body);
    const responseTime = Date.now() - startTime;

    if (response.statusCode === 200 || response.statusCode === 201) {
      recordResult(testName, true, responseTime);
    } else {
      recordResult(testName, false, responseTime, `Status: ${response.statusCode}`);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordResult(
      testName,
      false,
      responseTime,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

async function testGetSessions(userId) {
  const testName = "Get Sessions";
  const startTime = Date.now();

  try {
    const response = await makeRequest("GET", "/api/trpc/oauth.getSessions");
    const responseTime = Date.now() - startTime;

    if (response.statusCode === 200 || response.statusCode === 401) {
      recordResult(testName, true, responseTime);
    } else {
      recordResult(testName, false, responseTime, `Status: ${response.statusCode}`);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordResult(
      testName,
      false,
      responseTime,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

async function testAuditLog(userId) {
  const testName = "Audit Log";
  const startTime = Date.now();

  try {
    const response = await makeRequest("GET", "/api/trpc/auditLog.getEvents?limit=10");
    const responseTime = Date.now() - startTime;

    if (response.statusCode === 200 || response.statusCode === 401) {
      recordResult(testName, true, responseTime);
    } else {
      recordResult(testName, false, responseTime, `Status: ${response.statusCode}`);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordResult(
      testName,
      false,
      responseTime,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

async function runLoadTest() {
  console.log("🚀 Starting Load Test");
  console.log(`📊 Configuration:`);
  console.log(`   - Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`   - Requests per User: ${REQUESTS_PER_USER}`);
  console.log(`   - Test Duration: ${TEST_DURATION_MS}ms`);
  console.log(`   - Total Expected Requests: ${CONCURRENT_USERS * REQUESTS_PER_USER * 4}`);
  console.log("");

  const startTime = Date.now();
  const promises = [];

  // Spawn concurrent users
  for (let userId = 1; userId <= CONCURRENT_USERS; userId++) {
    const userPromise = (async () => {
      for (let i = 0; i < REQUESTS_PER_USER; i++) {
        if (Date.now() - startTime > TEST_DURATION_MS) break;

        // Rotate through different test scenarios
        const testType = i % 4;
        switch (testType) {
          case 0:
            await testSignup(userId);
            break;
          case 1:
            await testLogin(userId);
            break;
          case 2:
            await testGetSessions(userId);
            break;
          case 3:
            await testAuditLog(userId);
            break;
        }

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    })();

    promises.push(userPromise);
  }

  // Wait for all tests to complete
  await Promise.all(promises);

  // Calculate and display results
  console.log("\n📈 Load Test Results:");
  console.log("=".repeat(80));

  let totalRequests = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  results.forEach((result) => {
    totalRequests += result.total;
    totalSuccess += result.success;
    totalFailed += result.failed;

    const successRate = ((result.success / result.total) * 100).toFixed(2);
    console.log(`\n${result.name}:`);
    console.log(`  Total Requests: ${result.total}`);
    console.log(`  Success: ${result.success} (${successRate}%)`);
    console.log(`  Failed: ${result.failed}`);
    console.log(`  Avg Response Time: ${result.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Min Response Time: ${result.minResponseTime.toFixed(2)}ms`);
    console.log(`  Max Response Time: ${result.maxResponseTime.toFixed(2)}ms`);

    if (result.errors.length > 0) {
      console.log(`  Sample Errors:`);
      result.errors.forEach((error) => {
        console.log(`    - ${error}`);
      });
    }
  });

  console.log("\n" + "=".repeat(80));
  console.log("📊 Overall Statistics:");
  console.log(`  Total Requests: ${totalRequests}`);
  console.log(`  Total Success: ${totalSuccess}`);
  console.log(`  Total Failed: ${totalFailed}`);
  console.log(
    `  Overall Success Rate: ${((totalSuccess / totalRequests) * 100).toFixed(2)}%`
  );

  // Calculate percentiles
  const sortedMetrics = metrics
    .filter((m) => m.endTime)
    .map((m) => m.endTime - m.startTime)
    .sort((a, b) => a - b);

  if (sortedMetrics.length > 0) {
    const p50 = sortedMetrics[Math.floor(sortedMetrics.length * 0.5)];
    const p95 = sortedMetrics[Math.floor(sortedMetrics.length * 0.95)];
    const p99 = sortedMetrics[Math.floor(sortedMetrics.length * 0.99)];

    console.log(`\n⏱️  Response Time Percentiles:`);
    console.log(`  P50: ${p50.toFixed(2)}ms`);
    console.log(`  P95: ${p95.toFixed(2)}ms`);
    console.log(`  P99: ${p99.toFixed(2)}ms`);
  }

  const testDuration = Date.now() - startTime;
  const requestsPerSecond = (totalRequests / (testDuration / 1000)).toFixed(2);

  console.log(`\n⚡ Performance:`);
  console.log(`  Test Duration: ${testDuration}ms`);
  console.log(`  Requests/Second: ${requestsPerSecond}`);

  // Determine if test passed
  const successRate = (totalSuccess / totalRequests) * 100;
  if (successRate >= 95) {
    console.log("\n✅ Load Test PASSED - System handles load well");
    process.exit(0);
  } else if (successRate >= 80) {
    console.log("\n⚠️  Load Test PASSED with warnings - Some issues under load");
    process.exit(0);
  } else {
    console.log("\n❌ Load Test FAILED - System cannot handle expected load");
    process.exit(1);
  }
}

// Run the load test
runLoadTest().catch((error) => {
  console.error("❌ Load test error:", error);
  process.exit(1);
});
