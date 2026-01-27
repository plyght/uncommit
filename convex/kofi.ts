import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subscriptions").collect();
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
