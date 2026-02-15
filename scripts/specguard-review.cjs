#!/usr/bin/env node
/**
 * SpecGuard Independent Reviewer (Step 8)
 *
 * Usage: node scripts/specguard-review.js MORT-XXX
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { readState, writeState } = require("./specguard-state.cjs");

const REPO_ROOT = path.join(__dirname, "..");

function main() {
  const taskId = process.argv[2];
  if (!taskId) {
    console.error("Usage: node scripts/specguard-review.js MORT-XXX");
    process.exit(1);
  }

  const state = readState(taskId);
  if (!state) {
    console.error(`No JSON state found for ${taskId}. Run: node scripts/specguard-migrate.js ${taskId}`);
    process.exit(1);
  }

  for (let i = 1; i <= 7; i++) {
    const s = state.steps[String(i)];
    if (!s || s.status !== "complete") {
      console.error(`Step ${i} is "${s ? s.status : "missing"}" — all steps 1-7 must be complete before review`);
      process.exit(1);
    }
  }

  const taskMdPath = path.join(REPO_ROOT, ".specguard", "tasks", `${taskId}.md`);
  let taskMd = "";
  if (fs.existsSync(taskMdPath)) {
    taskMd = fs.readFileSync(taskMdPath, "utf-8");
  }

  const prompt = buildReviewPrompt(taskId, taskMd, state);
  const claudeAvailable = isCommandAvailable("claude");

  console.log();
  console.log("╔══════════════════════════════════════════════════╗");
  console.log(`║  SpecGuard Review — ${taskId.padEnd(29)}║`);
  console.log("╚══════════════════════════════════════════════════╝");
  console.log();

  if (claudeAvailable) {
    console.log("  Claude CLI detected. Launching independent review...");
    console.log();
    launchClaudeReview(taskId, prompt, state);
  } else {
    const promptPath = path.join(REPO_ROOT, ".specguard", "tasks", `${taskId}.review-prompt.txt`);
    fs.writeFileSync(promptPath, prompt, "utf-8");
    console.log("  Claude CLI not found. Review prompt saved to:");
    console.log(`  ${promptPath}`);
    console.log();
    console.log("  To run the review manually:");
    console.log(`  1. Copy the prompt from the file above`);
    console.log(`  2. Paste into a NEW Claude session (no prior context)`);
    console.log(`  3. The reviewer will output APPROVED or REJECTED`);
    console.log();
  }
}

function buildReviewPrompt(taskId, taskMd, state) {
  const stateJson = JSON.stringify(state, null, 2);

  return `You are an independent hostile reviewer for SpecGuard task ${taskId}.
You did NOT implement this change. You did NOT write the tests.
Your job is to find reasons to REJECT, not to approve.

=== REVIEW CHECKLIST ===

1. Step Completeness Audit — every step 1-7 must be COMPLETE
2. Requirement Traceability — every acceptance criterion tested
3. Design-to-Implementation Alignment — files match, logic matches
4. Test Sufficiency — happy path, edge cases, error scenarios covered
5. Risk & Rollback — realistic assessment, specific rollback plan
6. Deviation Check — deviations documented and justified

=== TASK FILE (${taskId}.md) ===

${taskMd}

=== JSON STATE (${taskId}.state.json) ===

\`\`\`json
${stateJson}
\`\`\`

=== INSTRUCTIONS ===

1. Apply the 6-point checklist to the task.
2. Check EVERY item — do not skip any.
3. Cross-reference the JSON state with the markdown — flag inconsistencies.
4. Verify gate results in JSON state (step 7 gateResults) show actual test data.
5. Document at least one concern or observation.
6. End with a clear verdict: APPROVED or REJECTED.

Begin your review now.`;
}

function launchClaudeReview(taskId, prompt, state) {
  try {
    const result = execSync(`claude -p -`, {
      input: prompt,
      encoding: "utf-8",
      timeout: 300000,
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });

    console.log(result);

    const verdict = parseVerdict(result);
    if (verdict) {
      state.steps["8"].reviewVerdict = verdict;
      state.steps["8"].status = verdict === "APPROVED" ? "complete" : "pending";
      if (verdict === "APPROVED") {
        state.steps["8"].completedAt = new Date().toISOString();
        state.status = "complete";
        state.currentStep = null;
      }
      state.auditTrail.push({
        step: 8,
        action: verdict === "APPROVED" ? "complete" : "reject",
        timestamp: new Date().toISOString(),
        notes: `Independent review: ${verdict}`,
      });
      writeState(taskId, state);

      console.log();
      console.log(`  Review verdict: ${verdict}`);
      console.log(`  State updated for ${taskId}`);
    }
  } catch (err) {
    console.error("  Claude review failed:", err.message || err);
    const promptPath = path.join(REPO_ROOT, ".specguard", "tasks", `${taskId}.review-prompt.txt`);
    fs.writeFileSync(promptPath, prompt, "utf-8");
    console.log(`  Prompt saved to: ${promptPath}`);
  }
}

function parseVerdict(output) {
  const match = output.match(/(?:Verdict|verdict|VERDICT)[:\s]*(APPROVED|REJECTED)/i) ||
    output.match(/\b(APPROVED|REJECTED)\b/);
  if (match) return match[1].toUpperCase();
  return null;
}

function isCommandAvailable(cmd) {
  try {
    const checkCmd = process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

main();
