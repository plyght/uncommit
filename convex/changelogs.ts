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
  args: { repoId: v.id("repos") },
  handler: async (ctx, { repoId }) => {
    return await ctx.db.query("changelogs").withIndex("by_repo", (q) => q.eq("repoId", repoId)).collect();
  },
});

export const getPublicChangelogs = query({
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

    const changelogs = await ctx.db
      .query("changelogs")
      .withIndex("by_repo_and_status", (q) => q.eq("repoId", repo._id).eq("status", "published"))
      .collect();

    return { repo, changelogs };
  },
});

export const getPublicChangelog = query({
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
    const changelog = await ctx.db
      .query("changelogs")
      .withIndex("by_repo_and_slug", (q) => q.eq("repoId", repo._id).eq("slug", postSlug))
      .unique();

    if (!changelog || changelog.status !== "published") return null;
    return { repo, changelog };
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
  },
  handler: async (ctx, { repoId, version, title, markdown, status }) => {
    const slug = `${createSlugBase(version)}-${createSlugBase(title)}`.replace(/-+/g, "-");
    const now = Date.now();
    const id = await ctx.db.insert("changelogs", {
      repoId,
      version,
      title,
      markdown,
      status,
      slug,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === "published" ? now : undefined,
    });
    return { id, slug };
  },
});

export const updateChangelog = mutation({
  args: { postId: v.id("changelogs"), title: v.string(), markdown: v.string() },
  handler: async (ctx, { postId, title, markdown }) => {
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
