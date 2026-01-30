import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const PRICING_TIERS = [
  { versions: 5, price: 15, kofiTier: "basic" },
  { versions: 15, price: 30, kofiTier: "pro" },
  { versions: 50, price: 60, kofiTier: "business" },
] as const;

export function calculatePrice(versionsPerMonth: number): number {
  const tier = PRICING_TIERS.find((t) => versionsPerMonth <= t.versions);
  if (tier) return tier.price;
  
  const highestTier = PRICING_TIERS[PRICING_TIERS.length - 1];
  const extraVersions = versionsPerMonth - highestTier.versions;
  const pricePerVersion = 1.2;
  return highestTier.price + Math.ceil(extraVersions * pricePerVersion);
}

export const getUsageForMonth = query({
  args: {
    repoOwner: v.string(),
    repoName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { count: 0, limit: 0, canGenerate: false };

    const repo = await ctx.db
      .query("repos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("repoOwner"), args.repoOwner),
          q.eq(q.field("repoName"), args.repoName)
        )
      )
      .first();

    if (!repo) return { count: 0, limit: 0, canGenerate: false };

    const now = Date.now();
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const usage = await ctx.db
      .query("apiUsage")
      .withIndex("by_repo", (q) =>
        q.eq("repoOwner", args.repoOwner).eq("repoName", args.repoName)
      )
      .filter((q) => q.gte(q.field("timestamp"), monthStart.getTime()))
      .collect();

    const count = usage.length;
    const limit = repo.versionsPerMonth ?? 0;

    return {
      count,
      limit,
      canGenerate: count < limit,
      repo: {
        apiKeyMode: repo.apiKeyMode,
        monthlyPrice: repo.monthlyPrice,
      },
    };
  },
});

export const recordApiUsage = mutation({
  args: {
    repoOwner: v.string(),
    repoName: v.string(),
    provider: v.string(),
    tokensUsed: v.number(),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.insert("apiUsage", {
      userId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      provider: args.provider,
      tokensUsed: args.tokensUsed,
      version: args.version,
      timestamp: Date.now(),
    });
  },
});

export const getUsageForCurrentMonth = internalQuery({
  args: {
    userId: v.id("users"),
    repoOwner: v.string(),
    repoName: v.string(),
  },
  handler: async (ctx, args) => {
    const repo = await ctx.db
      .query("repos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("repoOwner"), args.repoOwner),
          q.eq(q.field("repoName"), args.repoName)
        )
      )
      .first();

    if (!repo) return { count: 0, limit: 0, canGenerate: false };

    const now = Date.now();
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const usage = await ctx.db
      .query("apiUsage")
      .withIndex("by_repo", (q) =>
        q.eq("repoOwner", args.repoOwner).eq("repoName", args.repoName)
      )
      .filter((q) => q.gte(q.field("timestamp"), monthStart.getTime()))
      .collect();

    const count = usage.length;
    const limit = repo.versionsPerMonth ?? 0;

    return {
      count,
      limit,
      canGenerate: count < limit,
    };
  },
});

export const recordUsageInternal = internalMutation({
  args: {
    userId: v.id("users"),
    repoOwner: v.string(),
    repoName: v.string(),
    provider: v.string(),
    tokensUsed: v.number(),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("apiUsage", {
      userId: args.userId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      provider: args.provider,
      tokensUsed: args.tokensUsed,
      version: args.version,
      timestamp: Date.now(),
    });
  },
});
