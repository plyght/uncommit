# uncommit

AI-generated release notes from your code. Connect GitHub, select a repo, enter your API key, and we'll install a workflow that automatically generates release notes when you bump versions.

## Stack

- Next.js 14+ (App Router)
- Convex (auth, database, functions)
- @convex-dev/auth (GitHub OAuth)
- TweetNaCl (encryption for GitHub secrets)

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Initialize Convex

```bash
bunx convex dev
```

Follow prompts to create/link a Convex project. This will output your `NEXT_PUBLIC_CONVEX_URL`.

### 3. Create `.env.local`

```bash
cp .env.local.example .env.local
```

Add your `NEXT_PUBLIC_CONVEX_URL` from the previous step.

### 4. Configure GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: uncommit (or whatever you want)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: Your Convex HTTP Actions URL + `/api/auth/callback/github`
     - Find your HTTP Actions URL in [Convex Dashboard](https://dashboard.convex.dev) → Settings → URL & Deploy Key
     - It looks like: `https://your-deployment.convex.site`
     - Full callback: `https://your-deployment.convex.site/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret**

Set them in Convex:

```bash
npx convex env set AUTH_GITHUB_ID <your-client-id>
npx convex env set AUTH_GITHUB_SECRET <your-client-secret>
```

### 5. Run development server

```bash
bun dev
```

Visit http://localhost:3000

## How it works

1. User clicks "Connect GitHub" → GitHub OAuth via Convex Auth
2. After auth, user selects a repository from their GitHub account
3. User chooses AI provider (OpenAI or Anthropic) and enters their API key
4. We encrypt the API key and push it as a GitHub secret
5. We push a workflow YAML that triggers on version bumps in package.json, Cargo.toml, pyproject.toml, etc.
6. When they bump a version and push, the workflow generates AI release notes

## Production

For production deployment:

1. Create a separate GitHub OAuth App with production URLs
2. Set the callback URL to your production Convex HTTP Actions URL
3. Set production env vars: `npx convex env set --prod AUTH_GITHUB_ID ...`
4. Deploy to Vercel or your preferred host
