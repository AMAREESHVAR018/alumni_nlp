#!/usr/bin/env node
/**
 * API Integration Test
 * Run: node test-api.js
 */

const http = require("http");

function testEndpoint(path, method = "GET") {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: path,
      method: method,
      timeout: 3000,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({
            path,
            status: res.statusCode,
            data: JSON.parse(data),
            success: res.statusCode >= 200 && res.statusCode < 300,
          });
        } catch (e) {
          resolve({
            path,
            status: res.statusCode,
            data: data,
            success: res.statusCode >= 200 && res.statusCode < 300,
          });
        }
      });
    });

    req.on("error", (e) => {
      resolve({
        path,
        error: e.message,
        success: false,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        path,
        error: "Timeout",
        success: false,
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log("\n📋 TESTING ALUMNI CHAT API ENDPOINTS\n");
  console.log("=" .repeat(60));

  const endpoints = [
    "/health",
    "/ready",
    "/api",
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);

    if (result.success) {
      console.log(`✅ ${endpoint}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Data: ${JSON.stringify(result.data).substring(0, 80)}`);
      passed++;
    } else {
      console.log(`❌ ${endpoint}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else {
        console.log(`   Status: ${result.status}`);
      }
      failed++;
    }
    console.log("");
  }

  console.log("=" .repeat(60));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log("🎉 ALL TESTS PASSED!\n");
    process.exit(0);
  } else {
    console.log("⚠️  SOME TESTS FAILED\n");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
