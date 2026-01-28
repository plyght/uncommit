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
import { Skeleton } from "@/components/Skeleton";

type DashboardTab = "release" | "changelogs" | "settings";

export default function DashboardPage() {
  const repos = useQuery(api.repos.getUserRepos);
  const subscription = useQuery(api.users.getCurrentUserSubscription);
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
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[720px] text-left">
          <p className="text-[0.75rem] opacity-50">Loading…</p>
        </div>
      </main>
    );
  }

  const activeRepoData = repos.find((repo) => `${repo.repoOwner}/${repo.repoName}` === activeRepo);

  return (
    <main className="grid min-h-screen grid-cols-[240px_1fr] bg-[var(--bg)]">
      <aside className="flex flex-col justify-between border-r border-[var(--border)] bg-[var(--card-bg)] px-4 py-6">
        <div>
          <div className="mb-6 text-[0.9rem] font-semibold">&lt;uncommit/&gt;</div>
          <div className="mb-6 flex flex-col gap-3">
            <div className="text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Project</div>
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
              className="w-full"
              onClick={() => {
                setActiveRepo("");
                setActiveTab("settings");
              }}
            >
              New project
            </Button>
          </div>
          <nav className="flex flex-col gap-2">
            <button
              type="button"
              className={`w-full rounded-[var(--radius)] border px-3 py-2 text-left text-[0.75rem] transition-colors ${activeTab === "release" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-transparent opacity-70 hover:border-[var(--border)] hover:opacity-100"}`}
              onClick={() => setActiveTab("release")}
            >
              Release notes
            </button>
            <button
              type="button"
              className={`w-full rounded-[var(--radius)] border px-3 py-2 text-left text-[0.75rem] transition-colors ${activeTab === "changelogs" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-transparent opacity-70 hover:border-[var(--border)] hover:opacity-100"}`}
              onClick={() => setActiveTab("changelogs")}
            >
              Changelogs
            </button>
            <button
              type="button"
              className={`w-full rounded-[var(--radius)] border px-3 py-2 text-left text-[0.75rem] transition-colors ${activeTab === "settings" ? "border-[var(--accent)] bg-[var(--gray-100)]" : "border-transparent opacity-70 hover:border-[var(--border)] hover:opacity-100"}`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </nav>
        </div>
        <div className="flex flex-col gap-2">
          <div className="mb-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
            {subscription === undefined ? (
              <div className="text-[0.75rem] opacity-50">Loading plan…</div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="text-[0.75rem] font-medium">
                  {subscription?.tier === "pro" ? "Pro" : subscription?.tier === "supporter" ? "Supporter" : "Free"}
                </div>
                {subscription?.isActive ? (
                  <div className="text-[0.75rem] opacity-50">
                    Active until {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : "N/A"}
                  </div>
                ) : (
                  <a
                    href="https://ko-fi.com/uncommit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-[0.75rem] text-[var(--accent)] underline underline-offset-4"
                  >
                    Upgrade
                  </a>
                )}
              </div>
            )}
          </div>
          <Button onClick={() => void signOut()} className="w-full">
            Log out
          </Button>
        </div>
      </aside>

      <section className="p-8">
        {activeTab === "settings" ? (
          <div className="flex max-w-[820px] flex-col gap-3">
            <h1 className="text-[1.1rem] font-semibold">Project settings</h1>
            <p className="text-[0.6875rem] leading-relaxed opacity-50">Update plan, domain, version rules, and publish settings.</p>
            <RepoSetupForm selectedRepo={activeRepo} onSelectedRepoChange={setActiveRepo} />
          </div>
        ) : (
          <div className="flex max-w-[820px] flex-col gap-3">
            <h1 className="text-[1.1rem] font-semibold">
              {activeTab === "release" ? "Release notes" : "Changelogs"}
            </h1>
            <p className="text-[0.6875rem] leading-relaxed opacity-50">Manage posts for the selected project.</p>
            {activeRepoData ? (
              <RepoChangelogSection
                repoId={activeRepoData._id}
                repoName={`${activeRepoData.repoOwner}/${activeRepoData.repoName}`}
                type={activeTab === "release" ? "release" : "changelog"}
              />
            ) : (
              <p className="text-[0.6875rem] leading-relaxed opacity-50">Select a repo or create a new project.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function RepoChangelogSection({
  repoId,
  repoName,
  type,
}: {
  repoId: Id<"repos">;
  repoName: string;
  type: "release" | "changelog";
}) {
  const changelogs = useQuery(api.changelogs.listChangelogsForRepo, { repoId, type });
  const publish = useMutation(api.changelogs.publishChangelog);
  const unpublish = useMutation(api.changelogs.unpublishChangelog);
  const remove = useMutation(api.changelogs.deleteChangelog);

  if (changelogs === undefined) {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-4">
        <div className="mb-2 text-[0.85rem] font-semibold">{repoName}</div>
        <div className="mt-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton width={200} height={18} />
                <Skeleton width={60} height={12} />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton width={30} height={14} />
                <Skeleton width={80} height={36} />
                <Skeleton width={60} height={36} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-4">
      <div className="mb-2 text-[0.85rem] font-semibold">{repoName}</div>
      {changelogs.length === 0 ? (
        <p className="text-[0.75rem] opacity-50">
          {type === "release" ? "No release notes yet." : "No changelogs yet."}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {changelogs.map((post) => (
            <li key={post._id} className="flex items-center justify-between gap-4">
              <div>
                <div>{post.title}</div>
                <div className="text-[0.75rem] opacity-50">{post.status}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/edit/${post._id}`} className="text-[0.75rem] underline underline-offset-4">
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
