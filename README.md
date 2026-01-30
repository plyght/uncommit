# Uncommit

Automated AI-generated release notes from your code. Uncommit installs a GitHub Actions workflow that detects version bumps and creates intelligent release notes by analyzing your diffs.

## Overview

Uncommit eliminates the tedium of writing release notes. When you bump your version and push to the default branch, the GitHub App webhook starts a Vercel Workflow to detect version changes, analyze diffs, and generate concise, user-facing changelog entries.

## Features

- **Automatic Version Detection**: Supports multiple languages and package managers (Node.js, Rust, Python, Swift, and generic version files)
- **Multi-Language Repository Support**: Detects version files across different ecosystems in monorepos
- **Intelligent Diff Analysis**: Analyzes code changes across 14+ file types to generate meaningful notes
- **Multi-Provider Support**: Works with OpenAI or Anthropic APIs
- **GitHub App Monitoring**: Webhook-driven detection of version bumps
- **Durable Workflows**: Uses Vercel Workflow for long-running AI generation

## Installation

```bash
git clone https://github.com/plyght/uncommit.git
cd uncommit
bun install

# Set up Convex backend
bunx convex dev
```

Create a `.env.local` file with your Convex deployment URL and GitHub OAuth credentials.

## Environment Variables

Required:
- `CONVEX_URL`: Convex deployment URL for server-side queries
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL for client-side queries
- `GITHUB_APP_ID`: GitHub App ID
- `GITHUB_APP_PRIVATE_KEY`: GitHub App private key (escaped newlines as `\\n`)
- `GITHUB_WEBHOOK_SECRET`: GitHub App webhook secret
- `NEXT_PUBLIC_GITHUB_APP_INSTALL_URL`: Link to install the GitHub App
- `OPENAI_API_KEY`: OpenAI API key used by workflows
- `NEXT_PUBLIC_APP_URL`: Base URL for dashboard links (e.g., `<https://app.uncommit.com>`)
- `NEXT_PUBLIC_APP_DOMAIN`: Primary app domain (used to detect custom domain requests)

## Usage

1. Navigate to the web interface and authenticate with GitHub
2. Select a repository and save setup preferences
3. Install the GitHub App

The webhook activates on pushes to the default branch when version files change. Version bump detection triggers the release flow automatically.

## How It Works

```
Version Bump → Push to Default Branch → Workflow Triggered
                                    ↓
                            Detect Version Change
                                    ↓
                            Generate Diff (since last tag)
                                    ↓
                            Send to AI Provider
                                    ↓
                            Create Tag + Release
```

The generated workflow:
- Compares current version against previous commit
- Fetches code diff since last tag (or initial commit)
- Sends diff to AI with structured prompts for release note generation
- Creates a git tag and GitHub release with the generated notes

## Architecture

- `app/page.tsx`: Single-page app with GitHub OAuth, repository selection, and workflow installation
- `components/Select.tsx`: Repository dropdown using Base UI
- `convex/auth.ts`: GitHub OAuth configuration with repo/workflow scopes
- `convex/github.ts`: GitHub API interactions (repos, secrets, workflow files)
- `convex/install.ts`: Workflow templates and installation logic
- `convex/encryption.ts`: NaCl-based secret encryption for GitHub Actions secrets

## Configuration

The installed workflow monitors these version files (priority order):
- `package.json` (Node.js)
- `Cargo.toml` (Rust)
- `pyproject.toml` (Python)
- `Version.swift` / `version.swift` (Swift/iOS)
- `version.txt` / `VERSION` (Generic)
- `uncommit.json` (Uncommit-specific)

For multi-language repositories, the first detected version file wins. Swift version files should contain declarations like `let version = "1.0.0"` or `public static let version = "1.0.0"`.

AI prompts are configured to produce:
- No emojis
- No title (GitHub displays it)
- Markdown headers: Features, Fixes, Improvements, Breaking Changes
- User-facing changes only

## Development

```bash
# Start Next.js dev server
bun run dev

# Start Convex backend
bun run convex:dev
```

Requires Bun runtime. Key dependencies: Next.js 14, Convex, @convex-dev/auth, @base-ui/react, tweetnacl.

## Pricing & Configuration

Uncommit offers two modes:

### 1. Self-Hosted (Free - BYOK)
- Bring your own OpenAI or Anthropic API key
- Use the workflows in `.github/workflows/aia.yml` (Anthropic) or `aio.yml` (OpenAI)
- No rate limits beyond your own API quota
- Full control and transparency

### 2. Managed Hosting (Paid)
- We provide the API keys
- Rate-limited by tier (Ko-fi subscription tiers)
- Includes custom domain support
- Uses `.github/workflows/managed.yml`

**Pricing Tiers** (Ko-fi):
- **Basic** ($15/mo): 5 releases/month
- **Pro** ($30/mo): 15 releases/month
- **Business** ($60/mo): 50 releases/month

All managed plans include custom domain support. Contact for enterprise/higher limits.

## Admin Operations

As an open source project, Uncommit includes admin functions for granting user access. These are **internal mutations** that can only be called via the Convex dashboard or CLI.

### Granting User Access

```bash
# Via Convex CLI
bunx convex run users:grantUserAccess --email "user@example.com" --tier "pro" --daysUntilExpiry 365
```

Available tiers: `free`, `supporter`, `pro`, `premium`

**Security Note**: Since this is open source, ensure your Convex deployment credentials are kept private. Only repository owners with Convex admin access can call internal mutations. Never expose these functions as public APIs.

### Self-Hosted Workflow Setup

For self-hosted (BYOK) setup:
1. Copy `.github/workflows/aia.yml` or `aio.yml` to your repo
2. Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to repository secrets
3. Bump version and push to main branch

### Managed API Setup

For managed hosting:
1. Subscribe via Ko-fi with desired tier
2. Link your Ko-fi email in dashboard
3. Copy `.github/workflows/managed.yml` to your repo
4. Add `UNCOMMIT_WEBHOOK_SECRET` from your dashboard to repository secrets
5. Optionally add `UNCOMMIT_API_URL` if self-hosting the platform

## License

[Elastic License 2.0](./LICENSE) — Source available. Free to use, modify, and learn from. Cannot be offered as a competing hosted service.
