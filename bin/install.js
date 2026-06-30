#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

const skillName = 'my-skill';
const sourceDir = path.join(__dirname, '..', 'skill');
const isWindows = process.platform === 'win32';

// ⚠️ Verify these against each tool's current docs before relying on them.
// Per-agent proprietary locations:
const AGENT_TARGETS = {
  'claude-code': path.join(os.homedir(), '.claude', 'skills', skillName),
  'cursor': path.join(os.homedir(), '.cursor', 'rules', skillName),
  'codex': path.join(os.homedir(), '.codex', 'skills', skillName),
  'gemini': path.join(os.homedir(), '.gemini', 'skills', skillName),
};

// Emerging cross-harness convention some tools are adopting.
// Not universally supported yet — offered as an option, not a default.
const SHARED_TARGET = path.join(os.homedir(), '.agents', 'skills', skillName);

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function isWindowsAdmin() {
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkSymlinkSupport() {
  if (!isWindows) return { supported: true };
  if (isWindowsAdmin()) return { supported: true };

  return {
    supported: false,
    reason:
      'Creating symlinks on Windows requires either Administrator privileges ' +
      'or Developer Mode enabled.\n\n' +
      'To fix this, do one of the following:\n' +
      '  1. Re-run this command from an elevated terminal:\n' +
      '       Right-click PowerShell/Command Prompt → "Run as administrator"\n' +
      '       then run: npx ' + skillName + '\n' +
      '  2. OR enable Developer Mode:\n' +
      '       Settings → Privacy & Security → For developers → Developer Mode (On)\n\n' +
      'Alternatively, choose "copy" mode instead of "symlink" — no special privileges needed.',
  };
}

function installTo(targetDir, mode) {
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  if (mode === 'symlink') {
    try {
      fs.symlinkSync(sourceDir, targetDir, 'dir');
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EACCES') {
        throw new Error(
          'Permission denied while creating symlink.\n' +
          (isWindows
            ? 'Run this terminal as Administrator, or enable Developer Mode, then try again.\n' +
              'Alternatively, re-run and choose "copy" mode instead.'
            : 'Try running with sufficient permissions (e.g. check folder ownership), ' +
              'or choose "copy" mode instead.')
        );
      }
      throw err;
    }
  } else {
    copyRecursive(sourceDir, targetDir);
  }
}

async function main() {
  console.log(`Installing "${skillName}"\n`);

  // 1. Choose install mode
  let mode = 'copy';
  const modeAns = (await ask('Install mode — [c]opy or [s]ymlink? (default: copy): ')).toLowerCase();
  if (modeAns.startsWith('s')) {
    const check = checkSymlinkSupport();
    if (!check.supported) {
      console.error(`\n❌ Cannot use symlink mode:\n\n${check.reason}\n`);
      const fallback = await ask('Continue with "copy" mode instead? (Y/n): ');
      if (fallback.toLowerCase().startsWith('n')) {
        console.log('Aborting. Re-run from an elevated terminal to use symlink mode.');
        process.exit(1);
      }
      mode = 'copy';
    } else {
      mode = 'symlink';
    }
  }

  // 2. Choose target(s) — per-agent folders, or the shared cross-harness folder
  const agentKeys = Object.keys(AGENT_TARGETS);
  const allOptions = [...agentKeys, 'shared (.agents — experimental, works across harnesses that support it)'];

  console.log('\nInstall targets:');
  allOptions.forEach((label, i) => {
    const target = i < agentKeys.length ? AGENT_TARGETS[agentKeys[i]] : SHARED_TARGET;
    console.log(`  ${i + 1}. ${label} (${target})`);
  });
  console.log(`  ${allOptions.length + 1}. all per-agent folders (not shared)`);
  console.log(`  ${allOptions.length + 2}. everything (all per-agent + shared)`);

  const choice = await ask(`\nInstall for which target(s)? (comma-separated numbers): `);
  const trimmed = choice.trim();

  let targets = []; // { key, dir }

  if (trimmed === String(allOptions.length + 1)) {
    targets = agentKeys.map((k) => ({ key: k, dir: AGENT_TARGETS[k] }));
  } else if (trimmed === String(allOptions.length + 2)) {
    targets = [...agentKeys.map((k) => ({ key: k, dir: AGENT_TARGETS[k] })), { key: 'shared', dir: SHARED_TARGET }];
  } else {
    const indices = trimmed.split(',').map((s) => parseInt(s.trim(), 10) - 1);
    targets = indices
      .map((i) => {
        if (i < 0 || i >= allOptions.length) return null;
        if (i < agentKeys.length) return { key: agentKeys[i], dir: AGENT_TARGETS[agentKeys[i]] };
        return { key: 'shared', dir: SHARED_TARGET };
      })
      .filter(Boolean);
  }

  if (targets.length === 0) {
    console.error('No valid targets selected. Aborting.');
    process.exit(1);
  }

  // 3. Install
  for (const { key, dir } of targets) {
    try {
      installTo(dir, mode);
      console.log(`✅ [${key}] Installed (${mode}) → ${dir}`);
    } catch (err) {
      console.error(`❌ [${key}] Failed: ${err.message}`);
    }
  }

  console.log('\nDone.');
}

main();