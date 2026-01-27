import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.union(v.string(), v.null())),
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
  repos: defineTable({
    userId: v.id("users"),
    githubRepoId: v.optional(v.number()),
    repoOwner: v.string(),
    repoName: v.string(),
    installationId: v.optional(v.number()),
    planType: v.string(),
    slug: v.string(),
    customDomain: v.optional(v.string()),
    domainStatus: v.optional(v.string()),
    versionSource: v.string(),
    versionStrategy: v.string(),
    publishMode: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_custom_domain", ["customDomain"])
    .index("by_github_repo", ["githubRepoId"]),
  changelogs: defineTable({
    repoId: v.id("repos"),
    version: v.string(),
    title: v.string(),
    markdown: v.string(),
    status: v.string(),
    type: v.optional(v.string()),
    slug: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_repo", ["repoId"])
    .index("by_repo_and_status", ["repoId", "status"])
    .index("by_repo_and_slug", ["repoId", "slug"])
    .index("by_repo_and_type", ["repoId", "type"])
    .index("by_repo_status_type", ["repoId", "status", "type"]),
});
