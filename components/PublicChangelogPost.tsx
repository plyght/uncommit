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
      <main className="page">
        <div className="container">
          <p className="loading">Loading...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page">
        <div className="container">
          <h1 className="logo">&lt;uncommit/&gt;</h1>
          <p className="field-hint">Post not found.</p>
        </div>
      </main>
    );
  }

  const backHref = slug ? `/${slug}` : "/";

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <Link href={backHref} className="back-link">
            ← Back
          </Link>
          <h1 className="logo">{data.changelog.title}</h1>
          <p className="tagline">{data.repo.repoName}</p>
        </header>
        <article className="changelog-body">
          <MarkdownPreview markdown={data.changelog.markdown} />
        </article>
      </div>
    </main>
  );
}
