# Backend Architecture Standards Skill

A portable AI skill that enforces clean, production-ready backend architecture across multiple AI coding agents — Claude Code, Cursor, Codex, Gemini CLI, and more.

Before generating any backend code, the skill asks clarifying questions about project scope, scale, and requirements, then enforces layered architecture, ORM-based data access, dependency injection, input validation, externalized config, and consistent API design.

## What it enforces

- Three-layer architecture: Controllers → Service → Repository
- No hardcoded secrets — all config via environment variables
- ORM for all database access (no inline SQL by default)
- Thin controllers — business logic lives in the service layer
- Middleware for cross-cutting concerns (auth, logging, error handling, CORS, rate limiting)
- DTOs/ViewModels — never expose raw database entities
- Consistent API responses with meaningful HTTP status codes
- Dependency injection — no manual `new Service()` inside controllers
- Input validation on all external data
- Right-sized patterns — recommends simpler approaches for prototypes or scripts

## Install

### Via npx (no global install needed)

```bash
npx backend-architecture-standards-skill
```

### Via npm global install

```bash
npm install -g backend-architecture-standards-skill
backend-architecture-standards-skill
```

### From source

```bash
git clone <repo-url>
cd backend-architecture-standards
node bin/install.js
```

### Interactive installer

The installer guides you through three choices:

**1. Mode**
| Option | Description |
|--------|-------------|
| `copy` | Copies skill files — no special privileges, safest choice |
| `symlink` | Links to the package — stays in sync automatically (requires Admin or Developer Mode on Windows) |

**2. Scope**
| Option | Description |
|--------|-------------|
| `global` | Available in every project on this machine (`~/.claude/skills/…`) |
| `project` | Only in the current directory (`.claude/skills/…`), committable to git |

**3. Target agent**
| Option | Install path |
|--------|-------------|
| Claude Code | `~/.claude/skills/backend-architecture-standards-skill` |
| Cursor | `~/.cursor/rules/backend-architecture-standards-skill` |
| Codex | `~/.codex/skills/backend-architecture-standards-skill` |
| Gemini CLI | `~/.gemini/skills/backend-architecture-standards-skill` |
| Shared (experimental) | `~/.agents/skills/backend-architecture-standards-skill` |
| All per-agent | All of the above except Shared |
| Everything | All of the above including Shared |

You can select multiple targets with comma-separated numbers (e.g. `1,2`).

### Windows symlink note

Symlink mode on Windows requires one of:
- Run terminal as Administrator
- Enable Developer Mode: **Settings → Privacy & Security → For Developers → Developer Mode**

If neither is available, choose `copy` mode — it works without any elevated privileges.

## Uninstall

Remove the skill directory for each agent and scope where it was installed.

### Global installs

```bash
# Claude Code
rm -rf ~/.claude/skills/backend-architecture-standards-skill

# Cursor
rm -rf ~/.cursor/rules/backend-architecture-standards-skill

# Codex
rm -rf ~/.codex/skills/backend-architecture-standards-skill

# Gemini CLI
rm -rf ~/.gemini/skills/backend-architecture-standards-skill

# Shared
rm -rf ~/.agents/skills/backend-architecture-standards-skill
```

### Project installs

```bash
# Claude Code
rm -rf .claude/skills/backend-architecture-standards-skill

# Cursor
rm -rf .cursor/rules/backend-architecture-standards-skill

# Codex
rm -rf .codex/skills/backend-architecture-standards-skill

# Gemini CLI
rm -rf .gemini/skills/backend-architecture-standards-skill

# Shared
rm -rf .agents/skills/backend-architecture-standards-skill
```

### Windows (PowerShell)

```powershell
# Example for Claude Code global
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\skills\backend-architecture-standards-skill"
```

If you used `symlink` mode, removing the directory also removes the symlink — no leftover files.

## Usage in Claude Code

Once installed, invoke the skill in your Claude Code session:

```
/backend-architecture-standards-skill
```

Or reference it in a prompt:

> "Use the backend architecture standards skill to scaffold a REST API for user management."

## License

MIT
