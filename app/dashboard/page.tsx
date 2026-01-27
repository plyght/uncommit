"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/Button";

export default function DashboardPage() {
  const repos = useQuery(api.repos.getUserRepos);

  if (repos === undefined) {
    return (
      <main className="page">
        <div className="container">
          <p className="loading">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <h1 className="logo">Dashboard</h1>
          <p className="tagline">Manage changelogs</p>
        </header>
        <div className="dashboard-list">
          {repos.map((repo) => (
            <RepoChangelogSection key={repo._id} repoId={repo._id} repoName={`${repo.repoOwner}/${repo.repoName}`} />
          ))}
          {repos.length === 0 && <p className="field-hint">No repos configured yet.</p>}
        </div>
      </div>
    </main>
  );
}

function RepoChangelogSection({ repoId, repoName }: { repoId: Id<"repos">; repoName: string }) {
  const changelogs = useQuery(api.changelogs.listChangelogsForRepo, { repoId });
  const publish = useMutation(api.changelogs.publishChangelog);
  const unpublish = useMutation(api.changelogs.unpublishChangelog);
  const remove = useMutation(api.changelogs.deleteChangelog);

  if (changelogs === undefined) {
    return (
      <div className="dashboard-card">
        <div className="dashboard-header">{repoName}</div>
        <p className="loading-small">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <div className="dashboard-header">{repoName}</div>
      {changelogs.length === 0 ? (
        <p className="field-hint">No changelogs yet.</p>
      ) : (
        <ul className="dashboard-posts">
          {changelogs.map((post) => (
            <li key={post._id} className="dashboard-post">
              <div>
                <div>{post.title}</div>
                <div className="dashboard-meta">{post.status}</div>
              </div>
              <div className="dashboard-actions">
                <Link href={`/dashboard/edit/${post._id}`} className="field-link">
                  Edit
                </Link>
                {post.status === "published" ? (
                  <Button onClick={() => void unpublish({ postId: post._id })}>Unpublish</Button>
                ) : (
                  <Button onClick={() => void publish({ postId: post._id })}>Publish</Button>
                )}
                <Button onClick={() => void remove({ postId: post._id })}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
