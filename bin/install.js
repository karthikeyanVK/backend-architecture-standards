#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

const skillName = 'backend-architecture-standards-skill';
const sourceDir = path.join(__dirname, '..', 'skill');
const isWindows = process.platform === 'win32';
const cwd = process.cwd();

// ── Colors (no deps — plain ANSI) ─────────────────────────────
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m',
  red: '\x1b[31m', magenta: '\x1b[35m', blue: '\x1b[34m',
};
const paint = (color, text) => `${c[color]}${text}${c.reset}`;
const header = (text) => console.log(`\n${paint('bold', paint('magenta', `\u25c6 ${text}`))}`);
const success = (text) => console.log(`${paint('green', '\u2714')} ${text}`);
const fail = (text) => console.log(`${paint('red', '\u2716')} ${text}`);
const info = (text) => console.log(`${paint('dim', '\u00b7')} ${paint('dim', text)}`);
const warn = (text) => console.log(`${paint('yellow', '\u26a0')} ${text}`);

const AGENT_TARGETS = {
  'claude-code': {
    label: 'Claude Code',
    global: path.join(os.homedir(), '.claude', 'skills', skillName),
    project: path.join(cwd, '.claude', 'skills', skillName),
  },
  'cursor': {
    label: 'Cursor',
    global: path.join(os.homedir(), '.cursor', 'rules', skillName),
    project: path.join(cwd, '.cursor', 'rules', skillName),
  },
  'codex': {
    label: 'Codex',
    global: path.join(os.homedir(), '.codex', 'skills', skillName),
    project: path.join(cwd, '.codex', 'skills', skillName),
  },
  'gemini': {
    label: 'Gemini CLI',
    global: path.join(os.homedir(), '.gemini', 'skills', skillName),
    project: path.join(cwd, '.gemini', 'skills', skillName),
  },
};

const SHARED_TARGET = {
  label: 'Shared (.agents - experimental, cross-harness)',
  global: path.join(os.homedir(), '.agents', 'skills', skillName),
  project: path.join(cwd, '.agents', 'skills', skillName),
};

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
      'Creating symlinks on Windows requires Administrator privileges or Developer Mode.\n\n' +
      paint('bold', '  Fix option 1 - run elevated:\n') +
      '    Right-click PowerShell/Command Prompt -> "Run as administrator"\n' +
      `    then run: npx ${skillName}\n\n` +
      paint('bold', '  Fix option 2 - enable Developer Mode:\n') +
      '    Settings -> Privacy & Security -> For developers -> Developer Mode (On)\n\n' +
      '  Or simply choose "copy" mode below - no special privileges needed.',
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
          'Permission denied while creating symlink.\n  ' +
          (isWindows
            ? 'Run this terminal as Administrator, or enable Developer Mode, then retry.\n  Or re-run and choose "copy" mode instead.'
            : 'Check folder ownership/permissions, or choose "copy" mode instead.')
        );
      }
      throw err;
    }
  } else {
    copyRecursive(sourceDir, targetDir);
  }
}

async function main() {
  console.log(paint('bold', paint('cyan', '\n================================================')));
  console.log(paint('bold', paint('cyan', `  Installing: ${skillName}`)));
  console.log(paint('bold', paint('cyan', '================================================')));

  header('Install mode');
  console.log(`  ${paint('cyan', '1')}) copy     ${paint('dim', '- independent files, safest, no privileges needed')}`);
  console.log(`  ${paint('cyan', '2')}) symlink  ${paint('dim', '- stays in sync with this package, may need privileges')}`);
  const modeAns = await ask(`${paint('yellow', '?')} Choose [1/2] (default 1): `);
  let mode = modeAns.trim() === '2' ? 'symlink' : 'copy';

  if (mode === 'symlink') {
    const check = checkSymlinkSupport();
    if (!check.supported) {
      fail('Cannot use symlink mode right now:\n');
      console.log(check.reason);
      const fallback = await ask(`\n${paint('yellow', '?')} Continue with copy mode instead? (Y/n): `);
      if (fallback.toLowerCase().startsWith('n')) {
        warn('Aborting. Re-run elevated to use symlink mode.');
        process.exit(1);
      }
      mode = 'copy';
    }
  }
  success(`Mode: ${paint('bold', mode)}`);

  header('Scope');
  console.log(`  ${paint('cyan', '1')}) global   ${paint('dim', '- available in every project on this machine')}`);
  console.log(`  ${paint('cyan', '2')}) project  ${paint('dim', `- only in ${cwd}, can be committed to git`)}`);
  const scopeAns = await ask(`${paint('yellow', '?')} Choose [1/2] (default 1): `);
  const scope = scopeAns.trim() === '2' ? 'project' : 'global';
  success(`Scope: ${paint('bold', scope)}`);

  header('Install targets');
  const agentKeys = Object.keys(AGENT_TARGETS);
  const allEntries = [
    ...agentKeys.map((k) => ({ key: k, ...AGENT_TARGETS[k] })),
    { key: 'shared', ...SHARED_TARGET },
  ];

  allEntries.forEach((entry, i) => {
    const dir = entry[scope];
    console.log(`  ${paint('cyan', String(i + 1))}) ${paint('bold', entry.label)} ${paint('dim', `(${dir})`)}`);
  });
  console.log(`  ${paint('cyan', String(allEntries.length + 1))}) all per-agent ${paint('dim', '(excludes shared)')}`);
  console.log(`  ${paint('cyan', String(allEntries.length + 2))}) everything ${paint('dim', '(all per-agent + shared)')}`);

  const choice = await ask(`${paint('yellow', '?')} Select target(s), comma-separated: `);
  const trimmed = choice.trim();

  let targets;
  if (trimmed === String(allEntries.length + 1)) {
    targets = allEntries.filter((e) => e.key !== 'shared');
  } else if (trimmed === String(allEntries.length + 2)) {
    targets = allEntries;
  } else {
    const indices = trimmed.split(',').map((s) => parseInt(s.trim(), 10) - 1);
    targets = indices.map((i) => allEntries[i]).filter(Boolean);
  }

  if (targets.length === 0) {
    fail('No valid targets selected. Aborting.');
    process.exit(1);
  }

  header('Installing');
  for (const entry of targets) {
    const dir = entry[scope];
    try {
      installTo(dir, mode);
      success(`${paint('bold', entry.label)} ${paint('dim', `(${mode}, ${scope})`)} -> ${dir}`);
    } catch (err) {
      fail(`${paint('bold', entry.label)} failed: ${err.message}`);
    }
  }

  console.log(`\n${paint('green', paint('bold', 'Done.'))}\n`);
}

main();