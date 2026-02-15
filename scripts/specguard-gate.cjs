#!/usr/bin/env node
/**
 * SpecGuard External Gate Runner (Step 7 Verification)
 *
 * Usage: node scripts/specguard-gate.js MORT-XXX
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { readState, writeState } = require("./specguard-state.cjs");

const REPO_ROOT = path.join(__dirname, "..");

function resolveGateConfig(state) {
  if (state.gateConfig && state.gateConfig.projectDir && state.gateConfig.commands) {
    return state.gateConfig;
  }

  const globalPath = path.join(REPO_ROOT, ".specguard", "gate.config.json");
  if (fs.existsSync(globalPath)) {
    try {
      return JSON.parse(fs.readFileSync(globalPath, "utf-8"));
    } catch {
      return null;
    }
  }

  return null;
}

function main() {
  const taskId = process.argv[2];
  if (!taskId) {
    console.error("Usage: node scripts/specguard-gate.js MORT-XXX");
    process.exit(1);
  }

  const state = readState(taskId);
  if (!state) {
    console.error(`No JSON state found for ${taskId}. Run: node scripts/specguard-migrate.js ${taskId}`);
    process.exit(1);
  }

  const s5 = state.steps["5"];
  const s6 = state.steps["6"];
  if (!s5 || s5.status !== "complete") {
    console.error(`Step 5 is "${s5 ? s5.status : "missing"}" — must be complete before running gate`);
    process.exit(1);
  }
  if (!s6 || s6.status !== "complete") {
    console.error(`Step 6 is "${s6 ? s6.status : "missing"}" — must be complete before running gate`);
    process.exit(1);
  }

  const config = resolveGateConfig(state);
  if (!config) {
    console.error(`No gate config found. Set gateConfig in ${taskId}.state.json or create .specguard/gate.config.json`);
    process.exit(1);
  }

  const projectDir = path.resolve(REPO_ROOT, config.projectDir);

  if (!fs.existsSync(projectDir)) {
    console.error(`Project directory not found: ${projectDir}`);
    process.exit(1);
  }

  const timeout = config.timeout || 120000;

  console.log();
  console.log("╔══════════════════════════════════════════════════╗");
  console.log(`║  SpecGuard Gate — ${taskId.padEnd(31)}║`);
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Project: ${config.projectDir.padEnd(39)}║`);
  console.log("╚══════════════════════════════════════════════════╝");
  console.log();

  const gateResults = {};
  let allPassed = true;
  const commandNames = Object.keys(config.commands);

  for (const name of commandNames) {
    const cmd = config.commands[name];
    const result = runCommand(name, cmd, projectDir, timeout);
    gateResults[name] = result;
    if (!result.passed) allPassed = false;
  }

  console.log();
  const maxNameLen = Math.max(...commandNames.map((n) => formatName(n).length));

  for (const name of commandNames) {
    const r = gateResults[name];
    const label = formatName(name).padEnd(maxNameLen + 2);
    const status = r.passed ? "PASS" : "FAIL";
    const counts = r.passCount !== undefined ? ` (${r.passCount} passed, ${r.failCount} failed)` : "";
    const duration = `[${(r.duration / 1000).toFixed(1)}s]`;
    console.log(`  ${label}${status}${counts.padEnd(30)}${duration}`);
  }

  console.log(`  ${"─".repeat(50)}`);
  console.log(`  Gate Result:  ${allPassed ? "PASS" : "FAIL"}`);
  console.log();

  state.steps["7"].gateResults = gateResults;

  if (allPassed) {
    state.steps["7"].status = "complete";
    state.steps["7"].completedAt = new Date().toISOString();
    state.auditTrail.push({
      step: 7,
      action: "complete",
      timestamp: new Date().toISOString(),
      notes: `Gate PASS — all ${commandNames.length} checks passed`,
    });
    state.currentStep = 8;
    writeState(taskId, state);
    console.log("  Step 7 marked COMPLETE. Proceed to Step 8 (Review).");
    console.log(`  Run: node scripts/specguard-review.js ${taskId}`);
  } else {
    state.steps["7"].status = "complete";
    state.steps["7"].completedAt = new Date().toISOString();
    state.steps["4"].status = "redo";
    state.steps["4"].completedAt = null;

    const failedChecks = commandNames.filter((n) => !gateResults[n].passed);
    state.auditTrail.push({
      step: 7,
      action: "fail",
      timestamp: new Date().toISOString(),
      notes: `Gate FAIL — failed: ${failedChecks.join(", ")}`,
    });
    state.auditTrail.push({
      step: 4,
      action: "redo",
      timestamp: new Date().toISOString(),
      notes: `Triggered by gate failure: ${failedChecks.join(", ")}`,
    });

    state.status = "redo";
    state.currentStep = 4;
    writeState(taskId, state);
    console.log("  Step 4 marked as REDO. Fix the failing checks and re-run the gate.");
  }

  console.log();
  process.exit(allPassed ? 0 : 1);
}

function runCommand(name, cmd, cwd, timeout) {
  const label = formatName(name);
  process.stdout.write(`  Running ${label}...`);

  const start = Date.now();
  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    stdout = execSync(cmd, {
      cwd,
      encoding: "utf-8",
      timeout,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err) {
    exitCode = err.status || 1;
    stdout = err.stdout || "";
    stderr = err.stderr || "";
  }

  const duration = Date.now() - start;
  const passed = exitCode === 0;

  let passCount, failCount;
  const combined = stdout + "\n" + stderr;
  const countMatch = combined.match(/(\d+)\s*(?:passed|pass)[,\s]*(\d+)\s*(?:failed|fail)/i) ||
    combined.match(/Tests:\s*(\d+)\s*passed.*?(\d+)\s*failed/i);

  if (countMatch) {
    passCount = parseInt(countMatch[1], 10);
    failCount = parseInt(countMatch[2], 10);
  } else {
    const passOnly = combined.match(/(\d+)\s*(?:passed|pass)/i);
    if (passOnly) {
      passCount = parseInt(passOnly[1], 10);
      failCount = 0;
    }
  }

  process.stdout.write(` ${passed ? "PASS" : "FAIL"}\n`);

  return {
    passed,
    exitCode,
    duration,
    passCount,
    failCount,
    stdout: stdout.slice(0, 2000),
    stderr: stderr.slice(0, 2000),
  };
}

function formatName(name) {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

main();
