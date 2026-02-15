#!/usr/bin/env node
/**
 * SpecGuard Dashboard
 * Shows all tasks, progress bars, current steps — at a glance.
 *
 * Usage: node scripts/specguard-status.js
 */
const fs = require("fs");
const path = require("path");
const { STEP_NAMES, TASKS_DIR, readState } = require("./specguard-state.cjs");

function parseTaskFromState(state) {
  let completedSteps = 0;
  for (let i = 1; i <= 8; i++) {
    if (state.steps[String(i)] && state.steps[String(i)].status === "complete") completedSteps++;
  }

  const isComplete = state.status === "complete" || completedSteps === 8;
  const currentStep = state.currentStep;

  const s5 = state.steps["5"];
  const s6 = state.steps["6"];
  const needsParallel =
    (currentStep === 5 || currentStep === 6) &&
    s5 && s6 &&
    (s5.status !== "complete" || s6.status !== "complete");

  const hasRedo = Object.values(state.steps).some((s) => s.status === "redo");

  return {
    id: state.taskId,
    status: state.status,
    currentStep,
    title: state.title,
    completedSteps,
    isComplete,
    needsParallel,
    hasRedo,
  };
}

function parseTaskFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const idMatch = content.match(/# Task:\s*([A-Z]+-\d+)/);
  const statusMatch = content.match(/\*\*Status:\*\*\s*(\S[^\n]*)/);
  const currentStepMatch = content.match(/\*\*Current Step:\*\*\s*(\d+)[^\n]*/);
  const titleMatch = content.match(/# Task:[^\—]*—\s*(.+)/);

  const id = (idMatch && idMatch[1]) || path.basename(filePath, ".md");
  const status = (statusMatch && statusMatch[1].trim()) || "";
  const currentStep = currentStepMatch ? parseInt(currentStepMatch[1], 10) : null;
  const title = (titleMatch && titleMatch[1].trim()) || id;

  let completedSteps = 0;
  for (let i = 1; i <= 8; i++) {
    const regex = new RegExp(`Step\\s*${i}[^\\[]*\\[✅`, "i");
    if (regex.test(content)) completedSteps++;
  }

  const isComplete = status.toLowerCase() === "complete" || completedSteps === 8;

  const step5Pending = /## Step 5[^]*?\[⏳ PENDING\]/.test(content) || /## Step 5[^]*?\[🔄 IN PROGRESS\]/.test(content);
  const step6Pending = /## Step 6[^]*?\[⏳ PENDING\]/.test(content) || /## Step 6[^]*?\[🔄 IN PROGRESS\]/.test(content);
  const needsParallel = (currentStep === 5 || currentStep === 6) && (step5Pending || step6Pending);

  const hasRedo = /🔁 REDO/i.test(content);

  return { id, status, currentStep, title, completedSteps, isComplete, needsParallel, hasRedo };
}

function parseTask(mdFile) {
  const taskId = path.basename(mdFile, ".md");
  const state = readState(taskId);
  if (state) return parseTaskFromState(state);
  return parseTaskFile(path.join(TASKS_DIR, mdFile));
}

function progressBar(completed, total, width = 20) {
  const filled = Math.round((completed / total) * width);
  const empty = width - filled;
  const pct = Math.round((completed / total) * 100);
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${pct}%  (${completed}/${total} steps)`;
}

function main() {
  if (!fs.existsSync(TASKS_DIR)) {
    console.log("No .specguard/tasks/ folder. Create a task from .specguard/templates/task-template.md");
    process.exit(0);
  }

  const files = fs.readdirSync(TASKS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");
  if (files.length === 0) {
    console.log("No task files in .specguard/tasks/. Copy task-template.md to start.");
    process.exit(0);
  }

  const tasks = files.map((f) => parseTask(f));
  const active = tasks.filter((t) => !t.isComplete);
  const completed = tasks.filter((t) => t.isComplete);

  console.log();
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║             SpecGuard Dashboard                  ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log();

  if (active.length > 0) {
    console.log("  Active Tasks:");
    console.log();
    for (const task of active) {
      const flag = task.hasRedo ? " 🔁 REDO" : "";
      const titleShort = task.title.length > 40 ? task.title.substring(0, 37) + "..." : task.title;
      console.log(`  ${task.needsParallel ? "⚡" : "🔄"} ${task.id} - ${titleShort}${flag}`);
      console.log(`     ${progressBar(task.completedSteps, 8)}`);
      if (task.currentStep) {
        console.log(`     → Current: Step ${task.currentStep} - ${STEP_NAMES[task.currentStep] || "Unknown"}`);
      }
      console.log();
    }
  } else {
    console.log("  No active tasks.");
    console.log();
  }

  if (completed.length > 0) {
    console.log("  Completed Tasks:");
    for (const task of completed) {
      const titleShort = task.title.length > 40 ? task.title.substring(0, 37) + "..." : task.title;
      console.log(`  ✅ ${task.id} - ${titleShort}`);
    }
    console.log();
  }

  console.log(`  Total: ${tasks.length} tasks | ${active.length} active | ${completed.length} complete`);
  console.log();

  if (active.length > 0) {
    const first = active[0];
    console.log("  ─── Next Action ───");
    console.log();

    if (first.needsParallel) {
      console.log("  ⚡ PARALLEL EXECUTION — Run TWO prompts:");
      console.log();
      console.log(`  Terminal 1: "Execute Step 5 ONLY for ${first.id}. Update task file when done."`);
      console.log(`  Terminal 2: "Execute Step 6 ONLY for ${first.id}. Update task file when done."`);
      console.log();
      console.log(`  Or generate prompts: node scripts/specguard-prompt.js ${first.id}`);
    } else if (first.currentStep === 1) {
      console.log(`  Say: "Start work on ${first.id}"`);
    } else {
      console.log(`  Say: "Continue with ${first.id}"`);
    }

    console.log();
    console.log(`  Validate: node scripts/specguard-validate.js ${first.id}`);
    console.log(`  Prompt:   node scripts/specguard-prompt.js ${first.id}`);
    console.log();
  }
}

main();
