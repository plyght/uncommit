"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Props = {
  slug?: string;
  customDomain?: string;
};

export function PublicChangelogList({ slug, customDomain }: Props) {
  const data = useQuery(api.changelogs.getPublicReleaseNotes, {
    slug: slug ?? undefined,
    domain: customDomain ? customDomain.toLowerCase() : undefined,
  });

  if (data === undefined) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,24rem)_1fr]">
          <aside className="border-b border-[var(--border)] bg-[var(--public-panel-bg)] px-6 py-12 lg:border-b-0 lg:border-r lg:px-10 lg:py-16">
            <div className="text-[0.75rem] uppercase tracking-[0.35em] text-[var(--public-muted)]">Release notes</div>
            <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.1]">Loading…</h1>
            <p className="mt-4 text-[0.9rem] text-[var(--public-muted)]">Fetching release notes.</p>
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
            <div className="text-[0.75rem] uppercase tracking-[0.35em] text-[var(--public-muted)]">Release notes</div>
            <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.1]">&lt;uncommit/&gt;</h1>
            <p className="mt-4 text-[0.9rem] text-[var(--public-muted)]">No public release notes found.</p>
          </aside>
          <section className="px-6 py-12 lg:px-12 lg:py-16">
            <div className="w-full max-w-[900px] text-left">
              <p className="text-[0.75rem] opacity-50">Release notes not found.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const repoLabel = `${data.repo.repoOwner}/${data.repo.repoName}`;

  const releaseNotes = [...data.releaseNotes].sort(
    (a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt)
  );

  return (
    <main className="relative min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_20%,var(--public-glow),var(--public-glow-fade)_60%)]" />
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <aside className="relative border-b border-[var(--border)] bg-[var(--public-panel-bg)] px-6 py-12 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-10 lg:py-16">
          <div className="text-[0.75rem] uppercase tracking-[0.35em] text-[var(--public-muted)]">Release notes</div>
          <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.1]">{data.repo.repoName}</h1>
          <p className="mt-3 text-[0.85rem] text-[var(--public-muted)]">{repoLabel}</p>
          <p className="mt-6 text-[0.95rem] leading-[1.7] text-[var(--public-muted)]">
            Public updates and product highlights. Changelogs stay private inside your dashboard.
          </p>
          <div className="mt-8 border border-[var(--public-panel-border)] bg-[var(--card-bg)] px-4 py-3">
            <div className="text-[0.7rem] uppercase tracking-[0.35em] text-[var(--public-muted)]">Subscribe</div>
            <div className="mt-3 flex flex-col gap-3 text-[0.85rem] text-[var(--public-muted)]">
              <span>Get notified when new release notes ship.</span>
              <a className="text-[var(--accent)]" href={slug ? `/${slug}/feed.xml` : "/feed.xml"}>
                RSS feed
              </a>
            </div>
          </div>
        </aside>

        <section className="px-6 py-12 lg:px-12 lg:py-16">
          <div className="w-full max-w-[900px] text-left">
            <div className="flex flex-col gap-6">
              {releaseNotes.length === 0 ? (
                <div className="border border-[var(--border)] bg-[var(--card-bg)] p-6">
                  <p className="text-[0.85rem] text-[var(--public-muted)]">No release notes yet.</p>
                </div>
              ) : (
                releaseNotes.map((post) => (
                  <article key={post._id} className="border border-[var(--border)] bg-[var(--card-bg)] p-6">
                    <div className="flex flex-wrap items-center gap-3 text-[0.75rem] uppercase tracking-[0.3em] text-[var(--public-muted)]">
                      <span>{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}</span>
                      <span className="h-[1px] w-10 bg-[var(--border)]" />
                      <span>{data.repo.repoName}</span>
                    </div>
                    <h2 className="mt-4 text-[1.5rem] font-semibold leading-[1.3]">
                      <Link className="transition-colors hover:text-[var(--accent)]" href={slug ? `/${slug}/${post.slug}` : `/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-3 text-[0.9rem] leading-[1.7] text-[var(--public-muted)]">
                      {post.markdown.split("\n").find((line) => line.trim().length > 0) ?? "Read the full release note."}
                    </p>
                    <div className="mt-4">
                      <Link className="text-[0.8rem] uppercase tracking-[0.3em] text-[var(--accent)]" href={slug ? `/${slug}/${post.slug}` : `/${post.slug}`}>
                        Read update →
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
