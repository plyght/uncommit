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
  const data = useQuery(api.changelogs.getPublicReleaseNote, {
    slug: slug ?? undefined,
    domain: customDomain ? customDomain.toLowerCase() : undefined,
    postSlug,
  });

  if (data === undefined) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,24rem)_1fr]">
          <aside className="border-b border-[var(--border)] bg-[var(--public-panel-bg)] px-6 py-12 lg:border-b-0 lg:border-r lg:px-10 lg:py-16">
            <div className="text-[0.75rem] uppercase tracking-[0.35em] text-[var(--public-muted)]">Release note</div>
            <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.1]">Loading…</h1>
            <p className="mt-4 text-[0.9rem] text-[var(--public-muted)]">Fetching release details.</p>
          </aside>
          <section className="px-6 py-12 lg:px-12 lg:py-16">
            <div className="w-full max-w-[900px] text-left">
              <p className="text-[0.75rem] opacity-50">Loading…</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,24rem)_1fr]">
          <aside className="border-b border-[var(--border)] bg-[var(--public-panel-bg)] px-6 py-12 lg:border-b-0 lg:border-r lg:px-10 lg:py-16">
            <div className="text-[0.75rem] uppercase tracking-[0.35em] text-[var(--public-muted)]">Release note</div>
            <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.1]">&lt;uncommit/&gt;</h1>
            <p className="mt-4 text-[0.9rem] text-[var(--public-muted)]">Release note not found.</p>
          </aside>
          <section className="px-6 py-12 lg:px-12 lg:py-16">
            <div className="w-full max-w-[900px] text-left">
              <p className="text-[0.75rem] opacity-50">Release note not found.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const backHref = slug ? `/${slug}` : "/";
  const repoLabel = `${data.repo.repoOwner}/${data.repo.repoName}`;

  return (
    <main className="relative min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_20%,var(--public-glow),var(--public-glow-fade)_60%)]" />
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <aside className="relative border-b border-[var(--border)] bg-[var(--public-panel-bg)] px-6 py-12 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-10 lg:py-16">
          <Link href={backHref} className="text-[0.75rem] uppercase tracking-[0.35em] text-[var(--public-muted)]">
            ← Back to release notes
          </Link>
          <h1 className="mt-4 text-[1.5rem] font-semibold leading-[1.15] sm:mt-6 sm:text-[2.5rem] sm:leading-[1.1]">{data.changelog.title}</h1>
          <p className="mt-3 text-[0.85rem] text-[var(--public-muted)]">{repoLabel}</p>
          <div className="mt-6 text-[0.75rem] uppercase tracking-[0.3em] text-[var(--public-muted)]">
            {new Date(data.changelog.publishedAt ?? data.changelog.createdAt).toLocaleDateString()}
          </div>
        </aside>
        <section className="px-6 py-12 lg:px-12 lg:py-16">
          <div className="w-full max-w-[900px] text-left">
            <article className="border border-[var(--border)] bg-[var(--card-bg)] p-5 sm:p-6">
              <div className="font-sans text-[1rem] leading-[1.7] text-[var(--fg)]">
                <MarkdownPreview markdown={data.changelog.markdown} />
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
