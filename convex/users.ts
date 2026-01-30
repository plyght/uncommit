import { query, internalQuery, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const { githubAccessToken, ...userWithoutToken } = user;
    return userWithoutToken;
  },
});

export const getUserWithToken = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const getUserInstallations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("installations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getCurrentUserSubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { status: null, tier: null, expiresAt: null, isActive: false };
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return { status: null, tier: null, expiresAt: null, isActive: false };
    }
    const isActive =
      user.subscriptionStatus === "active" &&
      user.subscriptionExpiresAt !== undefined &&
      user.subscriptionExpiresAt > Date.now();
    return {
      status: user.subscriptionStatus ?? null,
      tier: user.subscriptionTier ?? null,
      expiresAt: user.subscriptionExpiresAt ?? null,
      isActive,
    };
  },
});

export const linkKofiEmail = mutation({
  args: { kofiEmail: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(userId, { kofiEmail: args.kofiEmail });
  },
});

export const devSetSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    status: v.string(),
    tier: v.string(),
    daysUntilExpiry: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      subscriptionStatus: args.status,
      subscriptionTier: args.tier,
      subscriptionExpiresAt: Date.now() + args.daysUntilExpiry * 24 * 60 * 60 * 1000,
    });
  },
});

export const grantUserAccess = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    email: v.optional(v.string()),
    tier: v.union(
      v.literal("free"),
      v.literal("supporter"),
      v.literal("pro"),
      v.literal("premium")
    ),
    daysUntilExpiry: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.userId && !args.email) {
      throw new Error("Must provide either userId or email");
    }

    let userId = args.userId;
    if (!userId && args.email) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .first();
      if (!user) {
        throw new Error(`User with email ${args.email} not found`);
      }
      userId = user._id;
    }

    if (!userId) {
      throw new Error("Could not resolve user");
    }

    const status = args.tier === "free" ? "inactive" : "active";
    const daysUntilExpiry = args.daysUntilExpiry ?? 365;
    const expiresAt = Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000;

    await ctx.db.patch(userId, {
      subscriptionStatus: status,
      subscriptionTier: args.tier,
      subscriptionExpiresAt: expiresAt,
    });

    return {
      success: true,
      userId,
      tier: args.tier,
      status,
      expiresAt,
    };
  },
});
