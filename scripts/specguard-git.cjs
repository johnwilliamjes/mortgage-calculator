#!/usr/bin/env node
/**
 * SpecGuard — Git commit after step completion.
 *
 * Usage:
 *   node scripts/specguard-git.js "specguard: MORT-001 step 4 complete — Implementation"
 */
const { execSync } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const msg = args.filter((a) => a !== "--dry-run")[0] || "specguard: step complete";

const repoRoot = path.join(__dirname, "..");

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: repoRoot, encoding: "utf8", ...opts }).trim();
}

try {
  run("git add .specguard/tasks/*.md .specguard/tasks/*.state.json .specguard/AGENTS.md");

  let staged = "";
  try {
    staged = run("git diff --cached --name-only");
  } catch (_) {}

  if (!staged) {
    console.log("specguard-git: nothing to commit (no task file changes).");
    process.exit(0);
  }

  console.log("specguard-git: staged files:");
  staged.split("\n").forEach((f) => console.log("  " + f));

  if (dryRun) {
    console.log("\n(--dry-run) Would commit with message:");
    console.log("  " + msg);
    run("git reset HEAD .specguard/tasks/*.md .specguard/tasks/*.state.json .specguard/AGENTS.md 2>/dev/null || true");
    process.exit(0);
  }

  run(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
  console.log("specguard-git: committed — " + msg);

} catch (err) {
  console.error("specguard-git: error — " + (err.message || err));
  process.exit(1);
}
