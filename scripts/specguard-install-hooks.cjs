#!/usr/bin/env node
/**
 * SpecGuard Hook Installer
 * Installs pre-commit and post-commit hooks into .git/hooks/.
 *
 * Usage: node scripts/specguard-install-hooks.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function main() {
  let repoRoot;
  try {
    repoRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
  } catch {
    console.error("Not a git repository. Run git init first.");
    process.exit(1);
  }

  const hooksDir = path.join(repoRoot, ".git", "hooks");

  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const preCommitPath = path.join(hooksDir, "pre-commit");
  const preCommitContent = `#!/bin/sh
node "$(git rev-parse --show-toplevel)/scripts/pre-commit-hook.cjs"
`;

  installHook(preCommitPath, preCommitContent, "pre-commit");

  const postCommitPath = path.join(hooksDir, "post-commit");
  const postCommitContent = `#!/bin/sh
# SpecGuard post-commit: log commit info for audit
echo "specguard: commit $(git rev-parse --short HEAD) at $(date -Iseconds 2>/dev/null || date)" >> .specguard/.commit-log 2>/dev/null || true
`;

  installHook(postCommitPath, postCommitContent, "post-commit");

  console.log();
  console.log("SpecGuard hooks installed successfully.");
  console.log();
}

function installHook(hookPath, content, name) {
  const exists = fs.existsSync(hookPath);

  if (exists) {
    const existing = fs.readFileSync(hookPath, "utf-8");
    if (existing.includes("specguard")) {
      console.log(`  ${name}: already installed (contains specguard reference)`);
      return;
    }
    const updated = existing.trimEnd() + "\n\n# SpecGuard hook\n" + content.split("\n").slice(1).join("\n");
    fs.writeFileSync(hookPath, updated, { mode: 0o755 });
    console.log(`  ${name}: appended to existing hook`);
  } else {
    fs.writeFileSync(hookPath, content, { mode: 0o755 });
    console.log(`  ${name}: installed`);
  }
}

main();
