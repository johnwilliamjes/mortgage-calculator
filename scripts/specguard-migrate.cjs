#!/usr/bin/env node
/**
 * SpecGuard Migration
 * Reads existing .md files, generates .state.json sidecar files.
 *
 * Usage:
 *   node scripts/specguard-migrate.js           — migrate all tasks
 *   node scripts/specguard-migrate.js MORT-001   — migrate one task
 *   node scripts/specguard-migrate.js --force    — overwrite existing
 */
const fs = require("fs");
const path = require("path");
const {
  TASKS_DIR,
  STATE_VERSION,
  stateExists,
  writeState,
} = require("./specguard-state.cjs");

const args = process.argv.slice(2);
const force = args.includes("--force");
const targetTask = args.find((a) => a !== "--force" && !a.startsWith("-"));

function main() {
  if (!fs.existsSync(TASKS_DIR)) {
    console.error("No .specguard/tasks/ folder found.");
    process.exit(1);
  }

  let files;
  if (targetTask) {
    const mdFile = path.join(TASKS_DIR, `${targetTask}.md`);
    if (!fs.existsSync(mdFile)) {
      console.error(`Task file not found: ${mdFile}`);
      process.exit(1);
    }
    files = [`${targetTask}.md`];
  } else {
    files = fs.readdirSync(TASKS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");
  }

  if (files.length === 0) {
    console.log("No task files to migrate.");
    process.exit(0);
  }

  let migrated = 0;
  let skipped = 0;

  for (const file of files) {
    const taskId = path.basename(file, ".md");

    if (stateExists(taskId) && !force) {
      console.log(`  SKIP  ${taskId} — .state.json already exists (use --force to overwrite)`);
      skipped++;
      continue;
    }

    const mdPath = path.join(TASKS_DIR, file);
    const content = fs.readFileSync(mdPath, "utf-8");

    try {
      const state = parseMdToState(taskId, content);
      writeState(taskId, state);
      console.log(`  OK    ${taskId} — migrated (${countCompleteSteps(state)}/8 steps complete)`);
      migrated++;
    } catch (err) {
      console.error(`  FAIL  ${taskId} — ${err.message}`);
    }
  }

  console.log();
  console.log(`Migration complete: ${migrated} migrated, ${skipped} skipped, ${files.length} total`);
}

function parseMdToState(taskId, content) {
  const now = new Date().toISOString();

  const titleMatch = content.match(/# Task:[^\n]*—\s*(.+)/);
  const createdMatch = content.match(/\*\*Created:\*\*\s*(\S+)/);
  const statusMatch = content.match(/\*\*Status:\*\*\s*(\S[^\n]*)/);
  const currentStepMatch = content.match(/\*\*Current Step:\*\*\s*(\d+)/);

  const title = titleMatch ? titleMatch[1].trim() : taskId;
  const created = createdMatch ? createdMatch[1].trim() : now.slice(0, 10);
  const mdStatus = statusMatch ? statusMatch[1].trim().toLowerCase() : "in-progress";

  const steps = {};
  for (let i = 1; i <= 8; i++) {
    steps[String(i)] = parseStepFromMd(content, i);
  }

  const step7Section = extractStepSection(content, 7);
  if (step7Section && steps["7"].status === "complete") {
    steps["7"].gateResults = parseGateResults(step7Section);
  }

  steps["8"].reviewVerdict = null;
  const step8Section = extractStepSection(content, 8);
  if (step8Section) {
    const approvedMatch = step8Section.match(/(?:Approval|Verdict)[:\s]*(.*?APPROVED|.*?REJECTED)/i);
    if (approvedMatch) {
      steps["8"].reviewVerdict = approvedMatch[1].includes("APPROVED") ? "APPROVED" : "REJECTED";
    }
  }

  const auditTrail = parseAuditTrail(content);

  let status;
  const allComplete = Object.values(steps).every((s) => s.status === "complete");
  if (allComplete || mdStatus === "complete") {
    status = "complete";
  } else if (Object.values(steps).some((s) => s.status === "redo")) {
    status = "redo";
  } else {
    status = "in-progress";
  }

  let currentStep;
  if (currentStepMatch) {
    currentStep = parseInt(currentStepMatch[1], 10);
  } else if (allComplete || mdStatus === "complete") {
    currentStep = null;
  } else {
    for (let i = 1; i <= 8; i++) {
      if (steps[String(i)].status !== "complete") {
        currentStep = i;
        break;
      }
    }
  }

  return {
    version: STATE_VERSION,
    taskId,
    title,
    created,
    lastModified: now,
    status,
    currentStep,
    gateConfig: null,
    steps,
    auditTrail,
  };
}

function parseStepFromMd(content, stepNum) {
  const regex = new RegExp(`Step\\s*${stepNum}[^\\[]*\\[(.*?)\\]`, "i");
  const match = content.match(regex);

  const step = { status: "pending", completedAt: null, attempts: 1 };
  if (stepNum === 7) step.gateResults = null;
  if (stepNum === 8) step.reviewVerdict = null;
  if (!match) return step;

  const marker = match[1].trim();
  if (marker.includes("COMPLETE") || marker.includes("DONE")) {
    step.status = "complete";
    const section = extractStepSection(content, stepNum);
    if (section) {
      const dateMatch = section.match(/\*\*Completed:\*\*\s*(\S+)/);
      if (dateMatch && dateMatch[1] !== "—") step.completedAt = dateMatch[1].trim();
    }
  } else if (marker.includes("REDO")) {
    step.status = "redo";
  } else if (marker.includes("BLOCKED")) {
    step.status = "blocked";
  } else if (marker.includes("PROGRESS")) {
    step.status = "in-progress";
  }

  return step;
}

function parseGateResults(step7Section) {
  const results = {};
  const checkPatterns = [
    { key: "unitTests", pattern: /Unit tests?\s*pass\s*\|\s*(✅|❌)/i },
    { key: "functionalTests", pattern: /Functional tests?\s*pass\s*\|\s*(✅|❌)/i },
    { key: "lint", pattern: /(?:No )?lint(?:ing)?\s*(?:errors?)?\s*\|\s*(✅|❌)/i },
    { key: "security", pattern: /(?:No )?security\s*(?:warnings?)?\s*\|\s*(✅|❌)/i },
    { key: "build", pattern: /Build\s*(?:succeeds?)?\s*\|\s*(✅|❌)/i },
  ];

  for (const { key, pattern } of checkPatterns) {
    const match = step7Section.match(pattern);
    if (match) results[key] = { passed: match[1].includes("✅") };
  }

  if (Object.keys(results).length === 0) {
    const gateResult = step7Section.match(/Gate Result:?\s*.*(PASS|FAIL)/i);
    if (gateResult) results.overall = { passed: gateResult[1].toUpperCase() === "PASS" };
  }

  return Object.keys(results).length > 0 ? results : null;
}

function parseAuditTrail(content) {
  const trail = [];
  const auditSection = content.match(/## Audit Trail[\s\S]*$/i);
  if (!auditSection) return trail;

  const rows = auditSection[0].match(/\|\s*(\d+)\s*\|\s*([^|]+)\|\s*([^|]*)\|\s*([^|]*)\|/g);
  if (!rows) return trail;

  for (const row of rows) {
    const cols = row.split("|").filter((c) => c.trim()).map((c) => c.trim());
    if (cols.length >= 2) {
      const stepNum = parseInt(cols[0], 10);
      if (isNaN(stepNum)) continue;

      let action = "pending";
      if (cols[1].includes("✅")) action = "complete";
      else if (cols[1].includes("🔁")) action = "redo";
      else if (cols[1].includes("❌")) action = "fail";

      trail.push({
        step: stepNum,
        action,
        timestamp: cols.length > 2 ? cols[2] : "",
        notes: cols.length > 3 ? cols[3] : "",
      });
    }
  }

  return trail;
}

function extractStepSection(content, stepNum) {
  const regex = new RegExp(`## Step\\s*${stepNum}[\\s\\S]*?(?=## Step\\s*${stepNum + 1}|## Audit Trail|$)`, "i");
  const match = content.match(regex);
  return match ? match[0] : null;
}

function countCompleteSteps(state) {
  let count = 0;
  for (let i = 1; i <= 8; i++) {
    if (state.steps[String(i)] && state.steps[String(i)].status === "complete") count++;
  }
  return count;
}

main();
