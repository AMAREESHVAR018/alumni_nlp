/**
 * ============================================================
 * ALUMNI CHAT SYSTEM - COMPREHENSIVE VERIFICATION SCRIPT
 * Tests all services and reports system status
 * ============================================================
 * Usage: node verify-all.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

// ============================================================
// TEST FUNCTIONS
// ============================================================

function makeRequest(port, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => reject(error));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testService(name, port, endpoint) {
  try {
    const result = await makeRequest(port, endpoint);
    console.log(`${COLORS.green}✅${COLORS.reset} ${name} (${endpoint}): Status ${result.status}`);
    return true;
  } catch (error) {
    console.log(`${COLORS.red}❌${COLORS.reset} ${name}: ${error.message}`);
    return false;
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    const size = fs.statSync(filePath).size;
    console.log(`${COLORS.green}✅${COLORS.reset} ${description}: ${size.toLocaleString()} bytes`);
    return true;
  } else {
    console.log(`${COLORS.red}❌${COLORS.reset} ${description}: NOT FOUND`);
    return false;
  }
}

function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).length;
    console.log(`${COLORS.green}✅${COLORS.reset} ${description}: ${files} items`);
    return true;
  } else {
    console.log(`${COLORS.red}❌${COLORS.reset} ${description}: NOT FOUND`);
    return false;
  }
}

// ============================================================
// MAIN VERIFICATION
// ============================================================

async function runVerification() {
  console.log(`\n${COLORS.bright}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}ALUMNI CHAT SYSTEM - COMPREHENSIVE VERIFICATION${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);

  let passed = 0;
  let failed = 0;

  // ============================================================
  // 1. FILE STRUCTURE CHECKS
  // ============================================================
  console.log(`${COLORS.bright}${COLORS.cyan}📁 FILE STRUCTURE VERIFICATION${COLORS.reset}`);
  console.log(`${COLORS.cyan}${'─'.repeat(60)}${COLORS.reset}`);

  if (checkFile('server/server.js', 'Backend entry point')) passed++; else failed++;
  if (checkFile('server/app.js', 'Express app configuration')) passed++; else failed++;
  if (checkFile('server/config/database.js', 'Database manager')) passed++; else failed++;
  if (checkFile('server/services/mongoMockService.js', 'Mock database service')) passed++; else failed++;
  if (checkDirectory('server/routes', 'API routes')) passed++; else failed++;
  if (checkDirectory('server/models', 'Database models')) passed++; else failed++;
  if (checkDirectory('client/src', 'Frontend source')) passed++; else failed++;
  if (checkFile('client/package.json', 'Frontend configuration')) passed++; else failed++;

  // ============================================================
  // 2. ENVIRONMENT CONFIGURATION CHECKS
  // ============================================================
  console.log(`\n${COLORS.bright}${COLORS.cyan}⚙️  ENVIRONMENT CONFIGURATION${COLORS.reset}`);
  console.log(`${COLORS.cyan}${'─'.repeat(60)}${COLORS.reset}`);

  if (checkFile('server/.env', 'Backend environment file')) passed++; else failed++;
  
  const envPath = path.join(__dirname, 'server', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasPort = envContent.includes('PORT=');
    const hasJwtSecret = envContent.includes('JWT_SECRET=');
    const hasNodeEnv = envContent.includes('NODE_ENV=');
    
    if (hasPort && hasJwtSecret && hasNodeEnv) {
      console.log(`${COLORS.green}✅${COLORS.reset} Environment variables configured`);
      passed++;
    } else {
      console.log(`${COLORS.red}❌${COLORS.reset} Missing environment variables`);
      failed++;
    }
  }

  // ============================================================
  // 3. CONNECTIVITY CHECKS
  // ============================================================
  console.log(`\n${COLORS.bright}${COLORS.cyan}🔗 SERVICE CONNECTIVITY TESTS${COLORS.reset}`);
  console.log(`${COLORS.cyan}${'─'.repeat(60)}${COLORS.reset}`);

  if (await testService('Backend Health Check', 5000, '/health')) passed++; else failed++;
  if (await testService('Backend Ready Check', 5000, '/ready')) passed++; else failed++;
  if (await testService('API Base Endpoint', 5000, '/api')) passed++; else failed++;

  // ============================================================
  // 4. DEPENDENCIES CHECK
  // ============================================================
  console.log(`\n${COLORS.bright}${COLORS.cyan}📦 DEPENDENCIES CHECK${COLORS.reset}`);
  console.log(`${COLORS.cyan}${'─'.repeat(60)}${COLORS.reset}`);

  const serverNodeModules = path.join(__dirname, 'server', 'node_modules');
  const clientNodeModules = path.join(__dirname, 'client', 'node_modules');

  if (fs.existsSync(serverNodeModules)) {
    const modules = fs.readdirSync(serverNodeModules).length;
    console.log(`${COLORS.green}✅${COLORS.reset} Backend modules: ${modules} packages installed`);
    passed++;
  } else {
    console.log(`${COLORS.red}❌${COLORS.reset} Backend modules: Not installed`);
    failed++;
  }

  if (fs.existsSync(clientNodeModules)) {
    const modules = fs.readdirSync(clientNodeModules).length;
    console.log(`${COLORS.green}✅${COLORS.reset} Frontend modules: ${modules} packages installed`);
    passed++;
  } else {
    console.log(`${COLORS.yellow}⚠️ ${COLORS.reset} Frontend modules: Not installed (run: cd client && npm install)`);
  }

  // ============================================================
  // 5. SUMMARY
  // ============================================================
  console.log(`\n${COLORS.bright}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}📊 VERIFICATION SUMMARY${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);

  console.log(`${COLORS.green}✅ Passed: ${passed}${COLORS.reset}`);
  console.log(`${COLORS.red}❌ Failed: ${failed}${COLORS.reset}`);

  if (failed === 0) {
    console.log(`\n${COLORS.bright}${COLORS.green}✅ ALL CHECKS PASSED - SYSTEM READY!${COLORS.reset}`);
    console.log(`\nNext steps:`);
    console.log(`  1. Backend: cd server && npm start`);
    console.log(`  2. Frontend: cd client && npm start`);
    console.log(`  3. Open: http://localhost:3000`);
    process.exit(0);
  } else {
    console.log(`\n${COLORS.bright}${COLORS.yellow}⚠️  SOME CHECKS FAILED - SEE ERRORS ABOVE${COLORS.reset}`);
    process.exit(1);
  }
}

// Run verification
runVerification().catch(error => {
  console.error(`${COLORS.red}Fatal error: ${error.message}${COLORS.reset}`);
  process.exit(2);
});
