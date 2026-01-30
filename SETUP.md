# Setup Instructions

## Development Setup

After pulling the code and before starting development:

```bash
# Install dependencies
bun install

# Start Convex backend (generates types)
bunx convex dev
```

**Important**: The first `bunx convex dev` run will:
1. Push the schema to your Convex deployment
2. Generate TypeScript types in `convex/_generated/`
3. Create internal API references for functions

If you see TypeScript errors about `internal.pricing` or `internal.repos` not existing, this means Convex codegen hasn't run yet. Just start the dev server and the types will be generated.

## Environment Variables

Required for local development:

```bash
# .env.local
CONVEX_URL=your-convex-deployment-url
NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
GITHUB_APP_ID=your-github-app-id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_GITHUB_APP_INSTALL_URL=https://github.com/apps/your-app/installations/new
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=localhost

# For Ko-fi webhook
KOFI_VERIFICATION_TOKEN=your-kofi-verification-token

# For managed API (if hosting the paid service)
AI_WEBHOOK_SECRET=random-secret-for-workflow-auth
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
```

## Deployment Checklist

### Self-Hosted (Open Source)
1. Deploy Convex backend: `bunx convex deploy`
2. Deploy Next.js app (Vercel/your platform)
3. Set all environment variables in your platform
4. Create GitHub App and configure webhook URL
5. Users bring their own API keys

### Managed Hosting (SaaS)
All of the above, plus:
1. Set up Ko-fi account with webhook endpoint: `https://yourdomain.com/kofi/webhook`
2. Create Ko-fi tiers matching pricing structure
3. Set `KOFI_VERIFICATION_TOKEN` in environment
4. Set `AI_WEBHOOK_SECRET` for managed workflows
5. Add your own `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` for managed service
