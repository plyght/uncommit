import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    githubAccessToken: v.optional(v.string()),
  }).index("email", ["email"]),
  installations: defineTable({
    userId: v.id("users"),
    repoOwner: v.string(),
    repoName: v.string(),
    aiProvider: v.string(),
    installedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_repo", ["userId", "repoOwner", "repoName"]),
});
