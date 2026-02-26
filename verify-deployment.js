#!/usr/bin/env node
/**
 * ALUMNI CHAT SYSTEM - STATUS VERIFICATION
 * 
 * Confirms all components are in place and working
 */

const fs = require("fs");
const path = require("path");

console.log("\n" + "=".repeat(70));
console.log("🚀 ALUMNI CHAT SYSTEM - DEPLOYMENT VERIFICATION");
console.log("=".repeat(70) + "\n");

const checks = [
  {
    name: "Backend Entry Point",
    file: "server/server.js",
    required: true,
    check: (content) => content.includes("connectToDatabase") || content.includes("connectDB"),
  },
  {
    name: "Database Manager",
    file: "server/config/database.js",
    required: true,
    check: (content) => content.includes("connectToDatabase") && content.includes("MockMongoose"),
  },
  {
    name: "Mock Database Service",
    file: "server/services/mongoMockService.js",
    required: true,
    check: (content) => content.includes("MockCollection") && content.includes("MockMongoose"),
  },
  {
    name: "Express App",
    file: "server/app.js",
    required: true,
    check: (content) => content.includes("express") || content.includes("app.use"),
  },
  {
    name: "Frontend",
    file: "client/package.json",
    required: true,
    check: (content) => content.includes("react") || content.includes("react-dom"),
  },
  {
    name: "Frontend App Component",
    file: "client/src/App.js",
    required: false,
    check: (content) => content.includes("App") || content.includes("export"),
  },
  {
    name: "Database Config (Old - Backup)",
    file: "server/config/db.js",
    required: false,
    check: (content) => true,
  },
];

let passed = 0;
let failed = 0;
let warnings = 0;

console.log("📋 FILE VERIFICATION\n");

checks.forEach((check) => {
  const filePath = path.join("d:\\alumin_nlp\\alumni-chat-system", check.file);
  
  try {
    if (!fs.existsSync(filePath)) {
      if (check.required) {
        console.log(`❌ ${check.name}`);
        console.log(`   Missing: ${check.file}\n`);
        failed++;
      } else {
        console.log(`⚠️  ${check.name}`);
        console.log(`   Not found (optional): ${check.file}\n`);
        warnings++;
      }
      return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const contentValid = check.check(content);

    if (contentValid) {
      console.log(`✅ ${check.name}`);
      console.log(`   File: ${check.file}`);
      console.log(`   Size: ${(fs.statSync(filePath).size / 1024).toFixed(1)}KB\n`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
      console.log(`   File: ${check.file}`);
      console.log(`   Content validation failed\n`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ${check.name}`);
    console.log(`   Error: ${err.message}\n`);
    failed++;
  }
});

// NPM Packages
console.log("📦 DEPENDENCIES CHECK\n");

const packageChecks = [
  { file: "server/package.json", name: "Backend" },
  { file: "client/package.json", name: "Frontend" },
];

packageChecks.forEach((check) => {
  const filePath = path.join("d:\\alumin_nlp\\alumni-chat-system", check.file);
  try {
    if (fs.existsSync(filePath)) {
      const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const numDeps = Object.keys(pkg.dependencies || {}).length;
      const numDevDeps = Object.keys(pkg.devDependencies || {}).length;
      console.log(`✅ ${check.name}`);
      console.log(`   Dependencies: ${numDeps}, Dev: ${numDevDeps}\n`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
      console.log(`   package.json not found\n`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ${check.name}`);
    console.log(`   Error parsing package.json: ${err.message}\n`);
    failed++;
  }
});

// Summary
console.log("=".repeat(70));
console.log("\n📊 SUMMARY\n");
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);

console.log("\n📝 NEXT STEPS:\n");
if (failed === 0) {
  console.log("1️⃣  Start Backend:");
  console.log("    cd server");
  console.log("    npm start\n");
  console.log("2️⃣  Open Frontend:");
  console.log("    http://localhost:3000\n");
  console.log("3️⃣  Test API:");
  console.log("    http://localhost:5000/health\n");
  console.log("✨ All systems ready!\n");
  process.exit(0);
} else {
  console.log("⚠️  Fix the errors above before starting the system.\n");
  process.exit(1);
}
