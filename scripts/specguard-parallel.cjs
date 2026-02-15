#!/usr/bin/env node
/**
 * SpecGuard — Launch parallel Steps 5+6 execution with Claude Code.
 *
 * Usage: node scripts/specguard-parallel.js MORT-001
 */
const fs = require("fs");
const path = require("path");

const taskId = process.argv[2];

if (!taskId) {
  console.log("Usage: node scripts/specguard-parallel.js MORT-XXX");
  process.exit(1);
}

const taskFile = path.join(__dirname, "..", ".specguard", "tasks", `${taskId}.md`);

if (!fs.existsSync(taskFile)) {
  console.error(`Task file not found: ${taskFile}`);
  process.exit(1);
}

console.log("\n=== SpecGuard Parallel Execution (Steps 5 + 6) ===\n");
console.log(`Task: ${taskId}`);
console.log("\nRun these TWO commands in SEPARATE terminals:\n");
console.log("--- Terminal 1 (QA Unit — Step 5) ---");
console.log(`claude "Read .specguard/tasks/${taskId}.md and execute Step 5 ONLY.`);
console.log(`Update ONLY the '## Step 5 — Unit Validation' section.`);
console.log(`Do NOT touch Step 6. When done, commit: specguard: ${taskId} step 5 complete — Unit Validation"\n`);
console.log("--- Terminal 2 (QA Functional — Step 6) ---");
console.log(`claude "Read .specguard/tasks/${taskId}.md and execute Step 6 ONLY.`);
console.log(`Update ONLY the '## Step 6 — Functional Validation' section.`);
console.log(`Do NOT touch Step 5. When done, commit: specguard: ${taskId} step 6 complete — Functional Validation"\n`);
console.log("--- After BOTH complete ---");
console.log(`Say: "Continue with ${taskId}" for Step 7.\n`);
console.log("Note: Both agents edit the same file but different sections.");
console.log("Git will merge them automatically (no conflicts).\n");
