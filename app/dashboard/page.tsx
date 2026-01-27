"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { RepoSetupForm } from "@/components/RepoSetupForm";

type DashboardTab = "release" | "changelogs" | "settings";

export default function DashboardPage() {
  const repos = useQuery(api.repos.getUserRepos);
  const { signOut } = useAuthActions();
  const [activeTab, setActiveTab] = useState<DashboardTab>("release");
  const [activeRepo, setActiveRepo] = useState("");

  useEffect(() => {
    if (!repos || repos.length === 0) return;
    if (!activeRepo) {
      setActiveRepo(`${repos[0].repoOwner}/${repos[0].repoName}`);
    }
  }, [repos, activeRepo]);

  const projectItems = useMemo(
    () =>
      (repos ?? []).map((repo) => ({
        value: `${repo.repoOwner}/${repo.repoName}`,
        label: `${repo.repoOwner}/${repo.repoName}`,
      })),
    [repos]
  );

  if (repos === undefined) {
    return (
      <main className="page">
        <div className="container">
          <p className="loading">Loading...</p>
        </div>
      </main>
    );
  }

  const activeRepoData = repos.find((repo) => `${repo.repoOwner}/${repo.repoName}` === activeRepo);

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div>
          <div className="dashboard-brand">&lt;uncommit/&gt;</div>
          <div className="dashboard-project">
            <div className="label">Project</div>
            <Select
              items={projectItems}
              value={activeRepo}
              onValueChange={(value) => {
                setActiveRepo(value);
                if (activeTab !== "settings") {
                  setActiveTab("release");
                }
              }}
              placeholder="Select a repo"
            />
            <Button
              className="dashboard-new"
              onClick={() => {
                setActiveRepo("");
                setActiveTab("settings");
              }}
            >
              New project
            </Button>
          </div>
          <nav className="dashboard-nav">
            <button
              type="button"
              className={`dashboard-nav-button ${activeTab === "release" ? "active" : ""}`}
              onClick={() => setActiveTab("release")}
            >
              Release notes
            </button>
            <button
              type="button"
              className={`dashboard-nav-button ${activeTab === "changelogs" ? "active" : ""}`}
              onClick={() => setActiveTab("changelogs")}
            >
              Changelogs
            </button>
            <button
              type="button"
              className={`dashboard-nav-button ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </nav>
        </div>
        <div className="dashboard-footer">
          <Button onClick={() => void signOut()} className="dashboard-logout">
            Log out
          </Button>
        </div>
      </aside>

      <section className="dashboard-main">
        {activeTab === "settings" ? (
          <div className="dashboard-panel">
            <h1 className="dashboard-title">Project settings</h1>
            <p className="field-hint">Update plan, domain, version rules, and publish settings.</p>
            <RepoSetupForm selectedRepo={activeRepo} onSelectedRepoChange={setActiveRepo} />
          </div>
        ) : (
          <div className="dashboard-panel">
            <h1 className="dashboard-title">
              {activeTab === "release" ? "Release notes" : "Changelogs"}
            </h1>
            <p className="field-hint">Manage posts for the selected project.</p>
            {activeRepoData ? (
              <RepoChangelogSection
                repoId={activeRepoData._id}
                repoName={`${activeRepoData.repoOwner}/${activeRepoData.repoName}`}
              />
            ) : (
              <p className="field-hint">Select a repo or create a new project.</p>
            )}
          </div>
        )}
      </section>
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
