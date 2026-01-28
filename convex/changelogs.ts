import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function createSlugBase(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const listChangelogsForRepo = query({
  args: { repoId: v.id("repos"), type: v.optional(v.string()) },
  handler: async (ctx, { repoId, type }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const repo = await ctx.db.get(repoId);
    if (!repo || repo.userId !== userId) {
      throw new Error("Unauthorized");
    }
    const normalizedType = type ?? "changelog";
    if (normalizedType === "release") {
      return await ctx.db
        .query("changelogs")
        .withIndex("by_repo_and_type", (q) => q.eq("repoId", repoId).eq("type", "release"))
        .collect();
    }
    const entries = await ctx.db.query("changelogs").withIndex("by_repo", (q) => q.eq("repoId", repoId)).collect();
    return entries.filter((entry) => (entry.type ?? "changelog") === "changelog");
  },
});

export const listAllChangelogsForRepo = query({
  args: { repoId: v.id("repos") },
  handler: async (ctx, { repoId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const repo = await ctx.db.get(repoId);
    if (!repo || repo.userId !== userId) {
      throw new Error("Unauthorized");
    }
    const entries = await ctx.db
      .query("changelogs")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .order("desc")
      .collect();
    return entries;
  },
});

export const getPublicReleaseNotes = query({
  args: { slug: v.optional(v.string()), domain: v.optional(v.string()) },
  handler: async (ctx, { slug, domain }) => {
    const normalizedDomain = domain ? domain.toLowerCase() : undefined;
    const repo =
      (slug
        ? await ctx.db.query("repos").withIndex("by_slug", (q) => q.eq("slug", slug)).unique()
        : null) ??
      (domain
        ? await ctx.db
            .query("repos")
            .withIndex("by_custom_domain", (q) => q.eq("customDomain", normalizedDomain))
            .unique()
        : null);

    if (!repo) return null;

    const publicRepo = {
      slug: repo.slug,
      customDomain: repo.customDomain,
      repoOwner: repo.repoOwner,
      repoName: repo.repoName,
      domainStatus: repo.domainStatus,
    };

    const releaseNotes = await ctx.db
      .query("changelogs")
      .withIndex("by_repo_status_type", (q) =>
        q.eq("repoId", repo._id).eq("status", "published").eq("type", "release")
      )
      .collect();

    return { repo: publicRepo, releaseNotes };
  },
});

export const getPublicReleaseNote = query({
  args: { slug: v.optional(v.string()), domain: v.optional(v.string()), postSlug: v.string() },
  handler: async (ctx, { slug, domain, postSlug }) => {
    const normalizedDomain = domain ? domain.toLowerCase() : undefined;
    const repo =
      (slug
        ? await ctx.db.query("repos").withIndex("by_slug", (q) => q.eq("slug", slug)).unique()
        : null) ??
      (domain
        ? await ctx.db
            .query("repos")
            .withIndex("by_custom_domain", (q) => q.eq("customDomain", normalizedDomain))
            .unique()
        : null);

    if (!repo) return null;

    const publicRepo = {
      slug: repo.slug,
      customDomain: repo.customDomain,
      repoOwner: repo.repoOwner,
      repoName: repo.repoName,
      domainStatus: repo.domainStatus,
    };

    const changelog = await ctx.db
      .query("changelogs")
      .withIndex("by_repo_and_slug", (q) => q.eq("repoId", repo._id).eq("slug", postSlug))
      .unique();

    if (!changelog || changelog.status !== "published" || (changelog.type ?? "changelog") !== "release") return null;
    return { repo: publicRepo, changelog };
  },
});

export const getChangelogForEdit = query({
  args: { postId: v.id("changelogs") },
  handler: async (ctx, { postId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const changelog = await ctx.db.get(postId);
    if (!changelog) return null;
    const repo = await ctx.db.get(changelog.repoId);
    if (!repo || repo.userId !== userId) return null;
    return { repo, changelog };
  },
});

export const createChangelog = mutation({
  args: {
    repoId: v.id("repos"),
    version: v.string(),
    title: v.string(),
    markdown: v.string(),
    status: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, { repoId, version, title, markdown, status, type }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const repo = await ctx.db.get(repoId);
    if (!repo || repo.userId !== userId) {
      throw new Error("Unauthorized");
    }
    const slug = `${createSlugBase(version)}-${createSlugBase(title)}`.replace(/-+/g, "-");
    const now = Date.now();
    const id = await ctx.db.insert("changelogs", {
      repoId,
      version,
      title,
      markdown,
      status,
      type: type ?? "changelog",
      slug,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === "published" ? now : undefined,
    });
    return { id, slug };
  },
});

export const updateChangelog = mutation({
  args: { postId: v.id("changelogs"), title: v.string(), markdown: v.string(), type: v.optional(v.string()) },
  handler: async (ctx, { postId, title, markdown, type }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const changelog = await ctx.db.get(postId);
    if (!changelog) {
      throw new Error("Not found");
    }
    const repo = await ctx.db.get(changelog.repoId);
    if (!repo || repo.userId !== userId) {
      throw new Error("Unauthorized");
    }
    const slug = `${createSlugBase(changelog.version)}-${createSlugBase(title)}`.replace(/-+/g, "-");
    await ctx.db.patch(postId, {
      title,
      markdown,
      type: type ?? changelog.type ?? "changelog",
      slug,
      updatedAt: Date.now(),
    });
  },
});

export const publishChangelog = mutation({
  args: { postId: v.id("changelogs") },
  handler: async (ctx, { postId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const changelog = await ctx.db.get(postId);
    if (!changelog) {
      throw new Error("Not found");
    }
    const repo = await ctx.db.get(changelog.repoId);
    if (!repo || repo.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(postId, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const unpublishChangelog = mutation({
  args: { postId: v.id("changelogs") },
  handler: async (ctx, { postId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const changelog = await ctx.db.get(postId);
    if (!changelog) {
      throw new Error("Not found");
    }
    const repo = await ctx.db.get(changelog.repoId);
    if (!repo || repo.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(postId, {
      status: "unpublished",
      updatedAt: Date.now(),
    });
  },
});

export const deleteChangelog = mutation({
  args: { postId: v.id("changelogs") },
  handler: async (ctx, { postId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const changelog = await ctx.db.get(postId);
    if (!changelog) return;
    const repo = await ctx.db.get(changelog.repoId);
    if (!repo || repo.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(postId);
  },
});
