# Uncommit

Automated AI-generated release notes from your code. Uncommit installs a GitHub Actions workflow that detects version bumps and creates intelligent release notes by analyzing your diffs.

## Overview

Uncommit eliminates the tedium of writing release notes. When you bump your version and push to main, the installed workflow detects the change, analyzes your code diff since the last tag, and generates concise, user-facing release notes using your choice of AI provider.

## Features

- **Automatic Version Detection**: Supports package.json, Cargo.toml, pyproject.toml, version.txt, and VERSION files
- **Intelligent Diff Analysis**: Analyzes code changes across 14+ file types to generate meaningful notes
- **Multi-Provider Support**: Works with OpenAI or Anthropic APIs
- **Secure Key Storage**: API keys are encrypted client-side using NaCl before being stored as GitHub secrets
- **Zero Configuration**: One-click install per repository, no manual workflow editing required
- **Tag Management**: Automatically creates version tags and GitHub releases

## Installation

```bash
git clone https://github.com/plyght/uncommit.git
cd uncommit
bun install

# Set up Convex backend
bunx convex dev
```

Create a `.env.local` file with your Convex deployment URL and GitHub OAuth credentials.

## Usage

1. Navigate to the web interface and authenticate with GitHub
2. Select a repository from your account
3. Choose your AI provider (OpenAI or Anthropic)
4. Enter your API key
5. Click Install

The workflow activates on pushes to main/master when version files change. Version bump detected triggers the release flow automatically.

## How It Works

```
Version Bump → Push to Main → Workflow Triggered
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

- `app/page.tsx`: Landing page with GitHub OAuth
- `app/dashboard/page.tsx`: Repository selection and workflow installation
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

Requires Bun runtime. Key dependencies: Next.js 14, Convex, @convex-dev/auth, tweetnacl.

## License

MIT License
