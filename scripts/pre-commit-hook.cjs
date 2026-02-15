#!/usr/bin/env node
/**
 * SpecGuard Pre-Commit Hook
 * Blocks invalid commits before they happen.
 * Exit 0 = commit allowed, Exit 1 = commit blocked.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const {
  readState,
  validateStepSequence,
  validateGateResults,
} = require("./specguard-state.cjs");

function main() {
  let staged;
  try {
    staged = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
  } catch {
    process.exit(0);
  }

  if (!staged) process.exit(0);

  const stagedFiles = staged.split("\n").map((f) => f.trim()).filter(Boolean);

  const taskFiles = stagedFiles.filter(
    (f) => f.startsWith(".specguard/tasks/") && f.endsWith(".md")
  );

  if (taskFiles.length === 0) process.exit(0);

  const errors = [];
  const warnings = [];

  for (const taskFile of taskFiles) {
    const taskId = path.basename(taskFile, ".md");
    if (taskId === "README") continue;

    const state = readState(taskId);
    if (!state) {
      warnings.push(`${taskId}: no JSON state file found (markdown-only mode)`);
      continue;
    }

    errors.push(...validateStepSequence(state).map((e) => `${taskId}: ${e}`));
    errors.push(...validateGateResults(state).map((e) => `${taskId}: ${e}`));

    for (let step = 1; step <= 8; step++) {
      const s = state.steps[String(step)];
      if (s && s.status === "complete") {
        const hasEntry = state.auditTrail.some(
          (e) => e.step === step && e.action === "complete"
        );
        if (!hasEntry) {
          warnings.push(`${taskId}: Step ${step} complete but no audit trail entry`);
        }
      }
    }

    const repoRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
    const mdPath = path.join(repoRoot, taskFile);
    if (fs.existsSync(mdPath)) {
      const content = fs.readFileSync(mdPath, "utf-8");
      checkConsistency(taskId, state, content, warnings);
    }
  }

  if (errors.length > 0) {
    console.error();
    console.error("╔══════════════════════════════════════════════════╗");
    console.error("║  SpecGuard Pre-Commit: COMMIT BLOCKED            ║");
    console.error("╚══════════════════════════════════════════════════╝");
    console.error();
    errors.forEach((e) => console.error(`  ❌ ${e}`));
    if (warnings.length > 0) {
      console.error();
      warnings.forEach((w) => console.error(`  ⚠️  ${w}`));
    }
    console.error();
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log();
    console.log("  SpecGuard Pre-Commit: warnings (commit allowed)");
    warnings.forEach((w) => console.log(`  ⚠️  ${w}`));
    console.log();
  }

  process.exit(0);
}

function checkConsistency(taskId, state, content, warnings) {
  for (let step = 1; step <= 8; step++) {
    const jsonStatus = state.steps[String(step)] ? state.steps[String(step)].status : "pending";
    const regex = new RegExp(`Step\\s*${step}[^\\[]*\\[(.*?)\\]`, "i");
    const match = content.match(regex);
    if (!match) continue;

    const mdMarker = match[1].trim();
    const jsonNorm = normalizeStatus(jsonStatus);
    const mdNorm = normalizeStatus(mdMarker);

    if (jsonNorm !== mdNorm) {
      warnings.push(`${taskId}: Step ${step} JSON="${jsonStatus}" vs markdown="${mdMarker}"`);
    }
  }
}

function normalizeStatus(s) {
  const lower = s.toLowerCase().replace(/_/g, "");
  if (lower.includes("complete") || lower.includes("done")) return "complete";
  if (lower.includes("redo")) return "redo";
  if (lower.includes("block")) return "blocked";
  if (lower.includes("progress")) return "in-progress";
  if (lower.includes("pending")) return "pending";
  return lower;
}

main();
