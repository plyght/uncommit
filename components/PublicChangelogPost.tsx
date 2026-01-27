"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MarkdownPreview } from "@/components/MarkdownPreview";

type Props = {
  slug?: string;
  customDomain?: string;
  postSlug: string;
};

export function PublicChangelogPost({ slug, customDomain, postSlug }: Props) {
  const data = useQuery(api.changelogs.getPublicChangelog, {
    slug: slug ?? undefined,
    domain: customDomain ? customDomain.toLowerCase() : undefined,
    postSlug,
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
          <p className="text-[0.75rem] opacity-60">Post not found.</p>
        </div>
      </main>
    );
  }

  const backHref = slug ? `/${slug}` : "/";

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-12">
      <div className="w-full max-w-[820px] text-left">
        <header className="mb-8 flex items-center gap-6">
          <Link href={backHref} className="text-[0.75rem] opacity-60 hover:opacity-100">
            ← Back
          </Link>
          <div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.02em]">{data.changelog.title}</h1>
            <p className="text-[0.85rem] opacity-60">
              {data.repo.repoOwner}/{data.repo.repoName}
            </p>
          </div>
        </header>
        <article className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <div className="font-sans text-[1rem] leading-[1.7] text-[var(--fg)]">
            <MarkdownPreview markdown={data.changelog.markdown} />
          </div>
        </article>
      </div>
    </main>
  );
}
