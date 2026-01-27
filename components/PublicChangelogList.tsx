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
          <p className="field-hint">Changelog not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <h1 className="logo">{data.repo.repoName}</h1>
          <p className="tagline">Changelog</p>
        </header>
        <div className="changelog-list">
          {data.changelogs.map((post) => (
            <Link
              key={post._id}
              href={slug ? `/${slug}/${post.slug}` : `/${post.slug}`}
              className="changelog-item"
            >
              <span>{post.title}</span>
              <span className="changelog-meta">{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
