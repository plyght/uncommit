"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Props = {
  slug?: string;
  customDomain?: string;
};

export function PublicChangelogList({ slug, customDomain }: Props) {
  const data = useQuery(api.changelogs.getPublicChangelogs, {
    slug: slug ?? undefined,
    domain: customDomain ? customDomain.toLowerCase() : undefined,
  });

  if (data === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[820px] text-left">
          <p className="text-[0.75rem] opacity-60">Loading...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[820px] text-left">
          <h1 className="mb-2 text-[1.75rem] font-semibold tracking-[-0.02em]">&lt;uncommit/&gt;</h1>
          <p className="text-[0.75rem] opacity-60">Changelog not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-12">
      <div className="w-full max-w-[820px] text-left">
        <header className="mb-8">
          <h1 className="mb-2 text-[2rem] font-semibold tracking-[-0.02em]">{data.repo.repoName}</h1>
          <p className="text-[0.85rem] opacity-60">Changelog</p>
        </header>
        <div className="flex flex-col gap-3">
          {data.changelogs.map((post) => (
            <Link
              key={post._id}
              href={slug ? `/${slug}/${post.slug}` : `/${post.slug}`}
              className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 text-[0.85rem] transition-colors hover:border-[var(--accent)]"
            >
              <span>{post.title}</span>
              <span className="text-[0.75rem] opacity-60">
                {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
