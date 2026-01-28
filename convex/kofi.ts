import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

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
