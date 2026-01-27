import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function normalizeDomain(domain?: string) {
  if (!domain) return undefined;
  const trimmed = domain.trim();
  if (!trimmed) return undefined;
  try {
    const urlStr = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const url = new URL(urlStr);
    return url.hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function createSlugBase(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function createRandomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export const getUserRepos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("repos").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
  },
});

export const getRepoBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db.query("repos").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
  },
});

export const getRepoByCustomDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, { domain }) => {
    const normalized = normalizeDomain(domain);
    if (!normalized) return null;
    return await ctx.db.query("repos").withIndex("by_custom_domain", (q) => q.eq("customDomain", normalized)).unique();
  },
});

export const getRepoByGithubRepoId = query({
  args: { githubRepoId: v.number() },
  handler: async (ctx, { githubRepoId }) => {
    return await ctx.db
      .query("repos")
      .withIndex("by_github_repo", (q) => q.eq("githubRepoId", githubRepoId))
      .unique();
  },
});

export const saveRepoSettings = mutation({
  args: {
    githubRepoId: v.optional(v.number()),
    repoOwner: v.string(),
    repoName: v.string(),
    planType: v.string(),
    customDomain: v.optional(v.string()),
    versionSource: v.string(),
    versionStrategy: v.string(),
    publishMode: v.string(),
  },
  handler: async (
    ctx,
    { githubRepoId, repoOwner, repoName, planType, customDomain, versionSource, versionStrategy, publishMode }
  ) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const normalizedDomain = normalizeDomain(customDomain);
    const existing = await ctx.db
      .query("repos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.and(q.eq(q.field("repoOwner"), repoOwner), q.eq(q.field("repoName"), repoName)))
      .unique();

    const now = Date.now();
    if (existing) {
      const patchData: Record<string, unknown> = {
        planType,
        customDomain: normalizedDomain,
        domainStatus: normalizedDomain ? "pending" : undefined,
        versionSource,
        versionStrategy,
        publishMode,
        updatedAt: now,
      };
      if (githubRepoId !== undefined) {
        patchData.githubRepoId = githubRepoId;
      }
      await ctx.db.patch(existing._id, patchData);
      return existing._id;
    }

    const slug = `${createSlugBase(repoName)}-${createRandomSuffix()}`;
    return await ctx.db.insert("repos", {
      userId,
      githubRepoId,
      repoOwner,
      repoName,
      planType,
      slug,
      customDomain: normalizedDomain,
      domainStatus: normalizedDomain ? "pending" : undefined,
      versionSource,
      versionStrategy,
      publishMode,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const bindInstallationToRepo = mutation({
  args: {
    githubRepoId: v.number(),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
  },
  handler: async (ctx, { githubRepoId, installationId, repoOwner, repoName }) => {
    const repo =
      (await ctx.db
        .query("repos")
        .withIndex("by_github_repo", (q) => q.eq("githubRepoId", githubRepoId))
        .unique()) ??
      (await ctx.db
        .query("repos")
        .filter((q) => q.and(q.eq(q.field("repoOwner"), repoOwner), q.eq(q.field("repoName"), repoName)))
        .first());

    if (!repo) return null;
    await ctx.db.patch(repo._id, {
      githubRepoId,
      installationId,
      updatedAt: Date.now(),
    });
    return repo._id;
  },
});
