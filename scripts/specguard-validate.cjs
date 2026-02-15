#!/usr/bin/env node
/**
 * SpecGuard Validator
 * Catches rule violations before advancing to the next step.
 *
 * Usage: node scripts/specguard-validate.js MORT-XXX
 */
const fs = require("fs");
const path = require("path");
const {
  STEP_NAMES,
  TASKS_DIR,
  readState,
  validateStepSequence,
  validateGateResults,
} = require("./specguard-state.cjs");

function main() {
  const taskId = process.argv[2];
  if (!taskId) {
    console.error("Usage: node scripts/specguard-validate.js MORT-XXX");
    process.exit(1);
  }

  const taskFile = path.join(TASKS_DIR, `${taskId}.md`);

  if (!fs.existsSync(taskFile)) {
    console.error(`Task file not found: ${taskFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(taskFile, "utf-8");
  const state = readState(taskId);
  const errors = [];
  const warnings = [];

  if (state) {
    errors.push(...validateStepSequence(state));
    errors.push(...validateGateResults(state));
    checkStateAuditTrail(state, errors, warnings);
    checkStateConsistency(state, content, warnings);
  }

  checkStepSequence(content, errors);
  checkRequiredOutputs(content, errors, warnings);
  checkGuardRails(content, errors, warnings);
  checkGateReadiness(content, errors);
  checkAuditTrail(content, errors, warnings);

  const uniqueErrors = [...new Set(errors)];
  const uniqueWarnings = [...new Set(warnings)];

  console.log();

  if (uniqueErrors.length === 0 && uniqueWarnings.length === 0) {
    console.log(`✅ ${taskId} — All checks passed.`);
    if (state) console.log(`   (validated against JSON state + markdown)`);
    console.log();
    process.exit(0);
  }

  if (uniqueErrors.length > 0) {
    console.log(`❌ ${taskId} — VALIDATION FAILED`);
    console.log();
    uniqueErrors.forEach((e, i) => console.log(`  ${i + 1}. ❌ ${e}`));
  }

  if (uniqueWarnings.length > 0) {
    if (uniqueErrors.length > 0) console.log();
    console.log(`  Warnings:`);
    uniqueWarnings.forEach((w) => console.log(`  ⚠️  ${w}`));
  }

  console.log();
  process.exit(uniqueErrors.length > 0 ? 1 : 0);
}

function checkStateAuditTrail(state, errors, warnings) {
  for (let step = 1; step <= 8; step++) {
    const s = state.steps[String(step)];
    if (s && s.status === "complete") {
      const hasEntry = state.auditTrail.some(
        (e) => e.step === step && e.action === "complete"
      );
      if (!hasEntry) {
        warnings.push(`Step ${step} is complete in JSON state but has no audit trail entry`);
      }
    }
  }
}

function checkStateConsistency(state, content, warnings) {
  const mdStatuses = getStepStatuses(content);

  for (let step = 1; step <= 8; step++) {
    const jsonStatus = state.steps[String(step)] ? state.steps[String(step)].status : "pending";
    const mdStatus = mdStatuses[step] || "PENDING";

    const jsonNorm = normalizeStatus(jsonStatus);
    const mdNorm = normalizeStatus(mdStatus);

    if (jsonNorm !== mdNorm) {
      warnings.push(`Step ${step}: JSON state says "${jsonStatus}" but markdown says "${mdStatus}" — inconsistency`);
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

function getStepStatuses(content) {
  const statuses = {};
  for (let step = 1; step <= 8; step++) {
    const regex = new RegExp(`Step\\s*${step}[^\\[]*\\[(.*?)\\]`, "i");
    const match = content.match(regex);
    if (match) {
      const status = match[1].trim();
      if (status.includes("COMPLETE") || status.includes("DONE")) statuses[step] = "COMPLETE";
      else if (status.includes("REDO")) statuses[step] = "REDO";
      else if (status.includes("BLOCKED")) statuses[step] = "BLOCKED";
      else if (status.includes("PROGRESS")) statuses[step] = "IN_PROGRESS";
      else statuses[step] = "PENDING";
    } else {
      statuses[step] = "PENDING";
    }
  }
  return statuses;
}

function checkStepSequence(content, errors) {
  const statuses = getStepStatuses(content);

  for (let step = 2; step <= 8; step++) {
    if (statuses[step] === "COMPLETE") {
      if (step === 5 || step === 6) {
        if (statuses[4] !== "COMPLETE") {
          errors.push(`Step ${step} is COMPLETE but Step 4 is ${statuses[4]} — sequence violation`);
        }
      } else if (step === 7) {
        if (statuses[5] !== "COMPLETE") {
          errors.push(`Step 7 is COMPLETE but Step 5 is ${statuses[5]} — both QA steps required`);
        }
        if (statuses[6] !== "COMPLETE") {
          errors.push(`Step 7 is COMPLETE but Step 6 is ${statuses[6]} — both QA steps required`);
        }
      } else {
        const prev = step - 1;
        if (statuses[prev] !== "COMPLETE") {
          errors.push(`Step ${step} is COMPLETE but Step ${prev} is ${statuses[prev]} — sequence violation`);
        }
      }
    }
  }
}

function checkRequiredOutputs(content, errors, warnings) {
  const statuses = getStepStatuses(content);

  if (statuses[1] === "COMPLETE") {
    if (!content.match(/Problem Statement:?\s*\S/i)) {
      errors.push("Step 1 COMPLETE but missing Problem Statement");
    }
    if (!content.match(/Acceptance Criteria:?\s*\S/i)) {
      errors.push("Step 1 COMPLETE but missing Acceptance Criteria");
    }
  }

  if (statuses[2] === "COMPLETE") {
    if (!content.match(/Impacted Files:?\s*\S/i)) {
      errors.push("Step 2 COMPLETE but missing Impacted Files");
    }
  }

  if (statuses[3] === "COMPLETE") {
    if (!content.match(/Proposed Behavior:?\s*\S/i) && !content.match(/Logic Changes:?\s*\S/i)) {
      errors.push("Step 3 COMPLETE but missing Proposed Behavior or Logic Changes");
    }
  }

  if (statuses[4] === "COMPLETE") {
    if (!content.match(/Code Changes:?\s*\S/i)) {
      errors.push("Step 4 COMPLETE but missing Code Changes");
    }
  }
}

function checkGuardRails(content, errors, warnings) {
  const statuses = getStepStatuses(content);

  if (statuses[4] === "COMPLETE" && statuses[2] === "COMPLETE") {
    const step2Section = extractStepSection(content, 2);
    const step4Section = extractStepSection(content, 4);

    if (step2Section && step4Section) {
      const step2Files = new Set((step2Section.match(/`([^`]+\.\w+)`/g) || []).map((f) => f.replace(/`/g, "")));
      const step4Files = (step4Section.match(/`([^`]+\.\w+)`/g) || []).map((f) => f.replace(/`/g, ""));

      for (const file of step4Files) {
        if (file.includes("spec.") || file.includes("test.") || file.includes("Test")) continue;
        const basename = path.basename(file);
        const found = [...step2Files].some((f2) => f2.includes(basename) || basename.includes(path.basename(f2)));
        if (!found && step2Files.size > 0) {
          warnings.push(`Guard Rail: Step 4 modified ${file} — not found in Step 2 impact list`);
        }
      }
    }
  }
}

function checkGateReadiness(content, errors) {
  const statuses = getStepStatuses(content);

  if (statuses[7] === "COMPLETE") {
    if (content.match(/Gate Result:?\s*.*FAIL/i)) {
      if (!content.match(/REDO/i)) {
        errors.push("Step 7 FAILED but no REDO marker found — Step 4 should be marked REDO");
      }
    }
  }
}

function checkAuditTrail(content, errors, warnings) {
  const statuses = getStepStatuses(content);
  const auditSection = content.match(/## Audit Trail[\s\S]*$/i);

  if (!auditSection) {
    warnings.push("No Audit Trail section found");
    return;
  }

  const auditText = auditSection[0];

  for (let step = 1; step <= 8; step++) {
    if (statuses[step] === "COMPLETE") {
      const auditRegex = new RegExp(`\\|\\s*${step}\\s*\\|\\s*✅`, "i");
      if (!auditRegex.test(auditText)) {
        warnings.push(`Step ${step} is COMPLETE but Audit Trail doesn't show ✅ for Step ${step}`);
      }
    }
  }
}

function extractStepSection(content, stepNum) {
  const regex = new RegExp(`## Step\\s*${stepNum}[^#]*`, "i");
  const match = content.match(regex);
  return match ? match[0] : null;
}

main();
