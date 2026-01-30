import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const KOFI_TIER_MAP: Record<string, { versions: number; price: number }> = {
  "basic": { versions: 5, price: 15 },
  "pro": { versions: 15, price: 30 },
  "business": { versions: 50, price: 60 },
};

function mapKofiTierToVersions(tierName?: string): number {
  if (!tierName) return 0;
  const normalized = tierName.toLowerCase().trim();
  return KOFI_TIER_MAP[normalized]?.versions ?? 0;
}

export const updateUserSubscription = internalMutation({
  args: {
    email: v.string(),
    status: v.string(),
    tier: v.optional(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_kofi_email", (q) => q.eq("kofiEmail", args.email))
        .first();
    }

    if (!user) {
      return null;
    }

    await ctx.db.patch(user._id, {
      subscriptionStatus: args.status,
      subscriptionTier: args.tier,
      subscriptionExpiresAt: args.expiresAt,
    });

    return user._id;
  },
});

export const saveSubscription = internalMutation({
  args: {
    email: v.string(),
    kofiTransactionId: v.string(),
    type: v.string(),
    tierName: v.optional(v.string()),
    isFirstSubscription: v.boolean(),
    isSubscriptionPayment: v.boolean(),
    amount: v.string(),
    currency: v.string(),
    kofiFromName: v.string(),
    message: v.optional(v.string()),
    isPublic: v.boolean(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_transaction", (q) =>
        q.eq("kofiTransactionId", args.kofiTransactionId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("subscriptions", args);
  },
});

export const updateRepoLimitsForUser = internalMutation({
  args: {
    email: v.string(),
    tierName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_kofi_email", (q) => q.eq("kofiEmail", args.email))
        .first();
    }

    if (!user) return null;

    const versionsPerMonth = mapKofiTierToVersions(args.tierName);
    const monthlyPrice = KOFI_TIER_MAP[args.tierName?.toLowerCase().trim() ?? ""]?.price ?? 0;

    const userRepos = await ctx.db
      .query("repos")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("apiKeyMode"), "managed"))
      .collect();

    for (const repo of userRepos) {
      await ctx.db.patch(repo._id, {
        versionsPerMonth,
        monthlyPrice,
        updatedAt: Date.now(),
      });
    }

    return { updatedRepos: userRepos.length, versionsPerMonth };
  },
});
