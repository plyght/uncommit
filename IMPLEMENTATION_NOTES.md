# Implementation Notes

## What Was Done

### 1. GitHub Workflow Installation ✅
- **Fixed**: The workflows were NOT installed in `.github/workflows/`
- **Created**: Three workflow options:
  - `aia.yml` - Anthropic BYOK (self-hosted)
  - `aio.yml` - OpenAI BYOK (self-hosted)
  - `managed.yml` - Managed API with rate limiting (SaaS)

### 2. User Access Control ✅
- **Added**: `grantUserAccess` internal mutation in `convex/users.ts`
- **Supports**: Granting any tier to any user (email or userId)
- **Open source safe**: Internal mutation only, requires Convex admin access

### 3. Pricing Tiers for Ko-fi ✅
- **Created**: 3 simple tiers mapped to Ko-fi subscription names:
  - Basic ($15/mo): 5 releases/month
  - Pro ($30/mo): 15 releases/month
  - Business ($60/mo): 50 releases/month

### 4. Rate Limiting System ✅
- **Schema**: Added `apiUsage` table to track usage per user/repo
- **Schema**: Added `apiKeyMode`, `versionsPerMonth`, `monthlyPrice` to `repos` table
- **Created**: `convex/pricing.ts` with usage tracking and rate limit checks
- **Created**: `/ai/generate-release` webhook endpoint for managed workflows

### 5. Ko-fi Integration ✅
- **Added**: `updateRepoLimitsForUser` mutation to sync Ko-fi tiers
- **Added**: Ko-fi tier name mapping to version limits
- **Updated**: Ko-fi webhook to automatically update repo limits when subscription changes

## TypeScript Errors (Expected)

You'll see errors like:
```
Property 'pricing' does not exist on type...
Property 'updateRepoLimitsForUser' does not exist...
```

**This is expected** and will resolve automatically when you run:
```bash
bunx convex dev
```

This generates the `convex/_generated/` types that reference the new functions.

## Next Steps

### Before Testing
1. Run `bunx convex dev` to generate types
2. Set up Ko-fi tiers matching the tier names in `KOFI_TIER_MAP`
3. Add environment variables (see `SETUP.md`)

### Ko-fi Tier Setup
Create Ko-fi membership tiers with these **exact names** (case-insensitive):
- Basic ($15)
- Pro ($30)
- Business ($60)

The Ko-fi webhook will automatically map these to version limits.

### Testing the Managed Workflow
1. Subscribe to a Ko-fi tier
2. Link Ko-fi email in dashboard
3. Create a repo with `apiKeyMode: "managed"`
4. Add `.github/workflows/managed.yml` to the repo
5. Add `UNCOMMIT_WEBHOOK_SECRET` to repo secrets
6. Bump version and push

## Open Source Considerations

**Two deployment modes**:

1. **Self-Hosted**: Users fork/clone and deploy themselves
   - Free, no Ko-fi required
   - Users provide own API keys
   - Use `aia.yml` or `aio.yml` workflows

2. **Managed SaaS**: You host and provide API keys
   - Requires Ko-fi setup
   - Rate limiting enforced
   - Use `managed.yml` workflow
   - Charge via Ko-fi subscriptions

Both modes coexist - users choose based on their needs.

## Files Modified

- `convex/schema.ts` - Added `apiUsage` table, updated `repos`
- `convex/users.ts` - Added `grantUserAccess`
- `convex/repos.ts` - Added `getRepoByName` internal query
- `convex/kofi.ts` - Added Ko-fi tier mapping and repo limit updates
- `convex/http.ts` - Added `/ai/generate-release` webhook endpoint
- `convex/pricing.ts` - NEW: Usage tracking and rate limiting
- `lib/pricing.ts` - NEW: Shared pricing constants
- `.github/workflows/aia.yml` - Copied from root
- `.github/workflows/aio.yml` - Copied from root
- `.github/workflows/managed.yml` - NEW: Managed workflow template
- `README.md` - Updated with pricing and setup info
- `SETUP.md` - NEW: Development setup instructions

## Architecture

```
User pushes version bump
      ↓
GitHub workflow triggers
      ↓
   [Choice]
      ↓
┌─────┴──────┐
│            │
BYOK      Managed
(aia/aio)  (managed.yml)
│            │
Uses own    Calls your webhook
API key     /ai/generate-release
│            │
└─────┬──────┘
      ↓
   AI generates notes
      ↓
   Creates GitHub release
```

Managed workflow rate limiting:
```
Webhook checks usage
    ↓
Query apiUsage table
    ↓
Count releases this month
    ↓
Compare to versionsPerMonth
    ↓
Allow or 429 reject
```
