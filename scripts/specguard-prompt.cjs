#!/usr/bin/env node
/**
 * SpecGuard Prompt Generator
 * Reads task state and prints the exact prompt to paste into your AI agent.
 *
 * Usage: node scripts/specguard-prompt.js MORT-XXX
 */
const fs = require("fs");
const path = require("path");
const { readState } = require("./specguard-state.cjs");

const ROLES = {
  1: { name: "Business Analyst", emoji: "📋", guard: "Do NOT write code. Do NOT design solutions. Focus ONLY on requirements, acceptance criteria, and scope." },
  2: { name: "System Analyst", emoji: "🔍", guard: "Do NOT modify any code. READ-ONLY exploration. Map impacted files, test gaps, and regression risks." },
  3: { name: "Architect", emoji: "📐", guard: "Do NOT implement any code. Design the solution, define edge cases, and specify test scenarios." },
  4: { name: "Developer", emoji: "⌨️", guard: "Implement ONLY what was designed in Step 3. ONLY touch files identified in Step 2. No unrelated refactoring." },
  5: { name: "QA Unit", emoji: "🧪", guard: "Do NOT modify source code. ONLY write/update unit tests. Execute all tests and verify coverage." },
  6: { name: "QA Functional", emoji: "🧪", guard: "Do NOT modify source code. Run E2E/regression tests (Playwright preferred). Document results with evidence." },
  7: { name: "Gate Keeper", emoji: "🚦", guard: "Binary pass/fail ONLY. Run all checks: unit tests, functional tests, lint, security, build. No exceptions." },
  8: { name: "Reviewer", emoji: "✅", guard: "Do NOT change code. Verify ALL steps 1-7 are complete. Assess risk. Approve or reject with specific reasons." },
};

function main() {
  const taskId = process.argv[2];
  if (!taskId) {
    console.error("Usage: node scripts/specguard-prompt.js MORT-XXX");
    process.exit(1);
  }

  const taskDir = path.join(process.cwd(), ".specguard", "tasks");
  const taskFile = path.join(taskDir, `${taskId}.md`);

  if (!fs.existsSync(taskFile)) {
    console.error(`Task file not found: ${taskFile}`);
    process.exit(1);
  }

  const state = readState(taskId);
  let currentStep;

  if (state && state.currentStep) {
    currentStep = state.currentStep;
  } else {
    const content = fs.readFileSync(taskFile, "utf-8");
    const stepMatch = content.match(/Current Step:\s*(\d+)/i);
    if (!stepMatch) {
      console.log("Could not determine current step. Check the task file.");
      process.exit(1);
    }
    currentStep = parseInt(stepMatch[1], 10);
  }
  const role = ROLES[currentStep];

  if (!role) {
    console.log(`Task ${taskId} appears to be complete (all steps done).`);
    process.exit(0);
  }

  if (currentStep === 5) {
    printParallelPrompts(taskId);
  } else {
    printSinglePrompt(taskId, currentStep, role);
  }
}

function printSinglePrompt(taskId, step, role) {
  const box = "═".repeat(50);
  console.log();
  console.log(`╔${box}╗`);
  console.log(`║  ${role.emoji}  SpecGuard Prompt Generator                    ║`);
  console.log(`╠${box}╣`);
  console.log(`║  Task:  ${taskId.padEnd(41)}║`);
  console.log(`║  Step:  ${step} — ${role.name.padEnd(35)}║`);
  console.log(`╠${box}╣`);
  console.log(`║  PASTE THIS INTO YOUR AGENT:                     ║`);
  console.log(`╚${box}╝`);
  console.log();
  console.log(`You are now executing Step ${step} — ${role.name} for ${taskId}.`);
  console.log();
  console.log(`Role: ${role.name}`);
  console.log(`Guard Rails: ${role.guard}`);
  console.log();
  console.log(`Instructions:`);
  console.log(`1. Read .specguard/tasks/${taskId}.md`);
  console.log(`2. Execute Step ${step} following the workflow in .specguard/workflow.md`);
  console.log(`3. Fill in ALL required outputs for Step ${step}`);
  console.log(`4. Mark Step ${step} as ✅ COMPLETE when done`);
  console.log(`5. Update the Audit Trail table`);
  console.log(`6. Git commit: "specguard: ${taskId} step ${step} complete — ${role.name}"`);
  if (step < 8) {
    console.log(`7. Run: node scripts/specguard-validate.js ${taskId}`);
  }
  console.log();
}

function printParallelPrompts(taskId) {
  const box = "═".repeat(50);
  console.log();
  console.log(`╔${box}╗`);
  console.log(`║  ⚡  PARALLEL EXECUTION — Two prompts needed     ║`);
  console.log(`║  Run these in TWO separate terminals              ║`);
  console.log(`╠${box}╣`);
  console.log(`║  Task: ${taskId.padEnd(42)}║`);
  console.log(`╚${box}╝`);

  console.log();
  console.log(`┌── TERMINAL 1: QA Unit (Step 5) ─────────────────┐`);
  console.log();
  console.log(`You are executing Step 5 — QA Unit for ${taskId}.`);
  console.log(`Role: QA Unit`);
  console.log(`Guard Rails: ${ROLES[5].guard}`);
  console.log();
  console.log(`Instructions:`);
  console.log(`1. Read .specguard/tasks/${taskId}.md`);
  console.log(`2. Execute Step 5 ONLY`);
  console.log(`3. Write/update unit tests based on Step 3 design`);
  console.log(`4. Run all tests and document results`);
  console.log(`5. Mark Step 5 as ✅ COMPLETE`);
  console.log(`6. Git commit: "specguard: ${taskId} step 5 complete — QA Unit"`);
  console.log();
  console.log(`└──────────────────────────────────────────────────┘`);

  console.log();
  console.log(`┌── TERMINAL 2: QA Functional (Step 6) ────────────┐`);
  console.log();
  console.log(`You are executing Step 6 — QA Functional for ${taskId}.`);
  console.log(`Role: QA Functional`);
  console.log(`Guard Rails: ${ROLES[6].guard}`);
  console.log();
  console.log(`Instructions:`);
  console.log(`1. Read .specguard/tasks/${taskId}.md`);
  console.log(`2. Execute Step 6 ONLY`);
  console.log(`3. Run E2E tests (Playwright preferred) based on Step 3 scenarios`);
  console.log(`4. Verify regression — existing flows still work`);
  console.log(`5. Mark Step 6 as ✅ COMPLETE`);
  console.log(`6. Git commit: "specguard: ${taskId} step 6 complete — QA Functional"`);
  console.log();
  console.log(`└──────────────────────────────────────────────────┘`);
}

main();
