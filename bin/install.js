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
const header = (text) => console.log(`\n${paint('bold', paint('magenta', `◆ ${text}`))}`);
const success = (text) => console.log(`${paint('green', '✔')} ${text}`);
const fail = (text) => console.log(`${paint('red', '✖')} ${text}`);
const info = (text) => console.log(`${paint('dim', '·')} ${paint('dim', text)}`);
const warn = (text) => console.log(`${paint('yellow', '⚠')} ${text}`);

// ⚠️ Verify against each tool's current docs before relying on these long-term.
// Per-agent locations (global / project variants where the tool supports it).
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
    project: path.join(cwd, '.codex', 'skills',