# Uncommit

Automated AI-generated release notes from your code. Uncommit installs a GitHub Actions workflow that detects version bumps and creates intelligent release notes by analyzing your diffs.

## Overview

Uncommit eliminates the tedium of writing release notes. When you bump your version and push to the default branch, the GitHub App webhook starts a Vercel Workflow to detect version changes, analyze diffs, and generate concise, user-facing changelog entries.

## Features

- **Automatic Version Detection**: Supports package.json, Cargo.toml, pyproject.toml, version.txt, VERSION, and uncommit.json
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

The installed workflow monitors these version files:
- `package.json` (Node.js)
- `Cargo.toml` (Rust)
- `pyproject.toml` (Python)
- `version.txt` / `VERSION` (Generic)
- `uncommit.json` (Uncommit)

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

## License

[Elastic License 2.0](./LICENSE) — Source available. Free to use, modify, and learn from. Cannot be offered as a competing hosted service.
