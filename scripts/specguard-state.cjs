#!/usr/bin/env node
/**
 * SpecGuard State Module
 * Structured JSON state management for task enforcement.
 * State lives at .specguard/tasks/TASK-XXX.state.json alongside the .md file.
 */
const fs = require("fs");
const path = require("path");

const TASKS_DIR = path.join(__dirname, "..", ".specguard", "tasks");

const STEP_NAMES = {
  1: "Requirement Clarification",
  2: "Impact Analysis",
  3: "Design Update",
  4: "Implementation",
  5: "Unit Validation",
  6: "Functional Validation",
  7: "Verification Gate",
  8: "Review & Sign-Off",
};

const STATE_VERSION = 1;

function statePath(taskId) {
  return path.join(TASKS_DIR, `${taskId}.state.json`);
}

function stateExists(taskId) {
  return fs.existsSync(statePath(taskId));
}

function readState(taskId) {
  const p = statePath(taskId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch (err) {
    console.error(`specguard-state: failed to parse ${p}: ${err.message}`);
    return null;
  }
}

function writeState(taskId, state) {
  state.lastModified = new Date().toISOString();
  fs.writeFileSync(statePath(taskId), JSON.stringify(state, null, 2) + "\n", "utf-8");
}

function initState(taskId, opts = {}) {
  const now = new Date().toISOString();
  const state = {
    version: STATE_VERSION,
    taskId,
    title: opts.title || taskId,
    created: opts.created || now.slice(0, 10),
    lastModified: now,
    status: opts.status || "in-progress",
    currentStep: opts.currentStep || 1,
    gateConfig: opts.gateConfig || null,
    steps: {},
    auditTrail: [],
  };

  for (let i = 1; i <= 8; i++) {
    state.steps[i] = {
      status: "pending",
      completedAt: null,
      attempts: 0,
    };
  }

  state.steps[7].gateResults = null;
  state.steps[8].reviewVerdict = null;

  writeState(taskId, state);
  return state;
}

function updateStep(taskId, step, patch) {
  const state = readState(taskId);
  if (!state) throw new Error(`No state found for ${taskId}`);

  const stepStr = String(step);
  if (!state.steps[stepStr]) {
    state.steps[stepStr] = { status: "pending", completedAt: null, attempts: 0 };
  }

  Object.assign(state.steps[stepStr], patch);

  if (patch.status === "complete" && !state.steps[stepStr].completedAt) {
    state.steps[stepStr].completedAt = new Date().toISOString();
  }

  if (patch.status === "in-progress") {
    state.steps[stepStr].attempts = (state.steps[stepStr].attempts || 0) + 1;
  }

  state.auditTrail.push({
    step: Number(step),
    action: patch.status || "update",
    timestamp: new Date().toISOString(),
    notes: patch.notes || "",
  });

  state.currentStep = deriveCurrentStep(state);

  if (allStepsComplete(state)) {
    state.status = "complete";
  } else if (Object.values(state.steps).some((s) => s.status === "redo")) {
    state.status = "redo";
  } else {
    state.status = "in-progress";
  }

  writeState(taskId, state);
  return state;
}

function getCurrentStep(taskId) {
  const state = readState(taskId);
  if (!state) return null;
  return deriveCurrentStep(state);
}

function deriveCurrentStep(state) {
  for (let i = 1; i <= 8; i++) {
    const s = state.steps[String(i)];
    if (s && (s.status === "in-progress" || s.status === "redo")) return i;
  }
  for (let i = 1; i <= 8; i++) {
    const s = state.steps[String(i)];
    if (!s || s.status === "pending") return i;
  }
  return null;
}

function allStepsComplete(state) {
  for (let i = 1; i <= 8; i++) {
    if (!state.steps[String(i)] || state.steps[String(i)].status !== "complete") {
      return false;
    }
  }
  return true;
}

function validateStepSequence(state) {
  const errors = [];
  const steps = state.steps;

  for (let step = 2; step <= 8; step++) {
    const s = steps[String(step)];
    if (!s || s.status !== "complete") continue;

    if (step === 5 || step === 6) {
      const s4 = steps["4"];
      if (!s4 || s4.status !== "complete") {
        errors.push(`Step ${step} is complete but Step 4 is ${s4 ? s4.status : "missing"} — sequence violation`);
      }
    } else if (step === 7) {
      const s5 = steps["5"];
      const s6 = steps["6"];
      if (!s5 || s5.status !== "complete") {
        errors.push(`Step 7 is complete but Step 5 is ${s5 ? s5.status : "missing"} — both QA steps required`);
      }
      if (!s6 || s6.status !== "complete") {
        errors.push(`Step 7 is complete but Step 6 is ${s6 ? s6.status : "missing"} — both QA steps required`);
      }
    } else {
      const prev = steps[String(step - 1)];
      if (!prev || prev.status !== "complete") {
        errors.push(`Step ${step} is complete but Step ${step - 1} is ${prev ? prev.status : "missing"} — sequence violation`);
      }
    }
  }

  return errors;
}

function validateGateResults(state) {
  const errors = [];
  const step7 = state.steps["7"];

  if (!step7 || step7.status !== "complete") return errors;

  if (!step7.gateResults) {
    errors.push("Step 7 is complete but gateResults is missing — gate data integrity violation");
    return errors;
  }

  for (const [check, result] of Object.entries(step7.gateResults)) {
    if (!result.passed) {
      errors.push(`Step 7 is complete but gate check "${check}" did not pass`);
    }
  }

  return errors;
}

module.exports = {
  STEP_NAMES,
  TASKS_DIR,
  STATE_VERSION,
  statePath,
  stateExists,
  readState,
  writeState,
  initState,
  updateStep,
  getCurrentStep,
  deriveCurrentStep,
  allStepsComplete,
  validateStepSequence,
  validateGateResults,
};
