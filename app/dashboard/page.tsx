"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { SettingsModal } from "@/components/SettingsModal";
import { Skeleton } from "@/components/Skeleton";

export default function DashboardPage() {
  const repos = useQuery(api.repos.getUserRepos);
  const { signOut } = useAuthActions();
  const [activeRepo, setActiveRepo] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const activeRepoData = repos?.find(
    (repo) => `${repo.repoOwner}/${repo.repoName}` === activeRepo
  );

  if (repos === undefined) {
    return (
      <main className="flex min-h-screen flex-col px-6 py-6">
        <div className="mx-auto w-full max-w-[720px]">
          <p className="text-[0.75rem] opacity-50">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col px-6 py-6">
      <div className="mx-auto w-full max-w-[720px]">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="text-[0.9rem] font-semibold">&lt;uncommit/&gt;</div>
          <div className="flex items-center gap-3">
            <Select
              items={projectItems}
              value={activeRepo}
              onValueChange={setActiveRepo}
              placeholder="Select repo"
            />
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] text-[var(--fg)] opacity-70 transition-opacity hover:opacity-100"
              aria-label="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="2.5" />
                <path d="M13.5 8a5.5 5.5 0 01-.5 2.3l1.2 1.2-1.4 1.4-1.2-1.2a5.5 5.5 0 01-2.3.5 5.5 5.5 0 01-2.3-.5l-1.2 1.2-1.4-1.4 1.2-1.2A5.5 5.5 0 012.5 8a5.5 5.5 0 01.5-2.3L1.8 4.5l1.4-1.4 1.2 1.2A5.5 5.5 0 018 2.5a5.5 5.5 0 012.3.5l1.2-1.2 1.4 1.4-1.2 1.2a5.5 5.5 0 01.5 2.3z" />
              </svg>
            </button>
            <Button onClick={() => void signOut()}>Log out</Button>
          </div>
        </header>

        {activeRepoData ? (
          <ChangelogList
            repoId={activeRepoData._id}
            repoName={`${activeRepoData.repoOwner}/${activeRepoData.repoName}`}
          />
        ) : repos.length === 0 ? (
          <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <p className="text-[0.75rem] opacity-50">No projects yet.</p>
            <Button onClick={() => setSettingsOpen(true)}>Add project</Button>
          </div>
        ) : (
          <p className="text-[0.75rem] opacity-50">Select a repo above.</p>
        )}
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        selectedRepo={activeRepo}
        onSelectedRepoChange={setActiveRepo}
      />
    </main>
  );
}

function ChangelogList({
  repoId,
  repoName,
}: {
  repoId: Id<"repos">;
  repoName: string;
}) {
  const changelogs = useQuery(api.changelogs.listAllChangelogsForRepo, { repoId });
  const publish = useMutation(api.changelogs.publishChangelog);
  const unpublish = useMutation(api.changelogs.unpublishChangelog);
  const remove = useMutation(api.changelogs.deleteChangelog);

  if (changelogs === undefined) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3"
          >
            <div className="flex flex-col gap-1">
              <Skeleton width={180} height={16} />
              <Skeleton width={100} height={12} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton width={60} height={28} />
              <Skeleton width={50} height={28} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (changelogs.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <p className="text-[0.75rem] opacity-50">
          No posts yet. They will appear here when version bumps are detected.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {changelogs.map((post) => (
        <div
          key={post._id}
          className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3"
        >
          <div className="flex flex-col gap-1 overflow-hidden">
            <div className="truncate text-[0.8125rem]">{post.title}</div>
            <div className="flex items-center gap-2 text-[0.6875rem]">
              <span
                className={`rounded-[2px] px-1.5 py-0.5 ${
                  post.type === "release"
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "bg-[var(--gray-100)] text-[var(--gray-600)]"
                }`}
              >
                {post.type ?? "changelog"}
              </span>
              <span className="opacity-50">{post.status}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/dashboard/edit/${post._id}`}
              className="text-[0.6875rem] underline underline-offset-4 opacity-70 hover:opacity-100"
            >
              Edit
            </Link>
            {post.status === "published" ? (
              <Button onClick={() => void unpublish({ postId: post._id })}>
                Unpublish
              </Button>
            ) : (
              <Button onClick={() => void publish({ postId: post._id })}>
                Publish
              </Button>
            )}
            <button
              type="button"
              onClick={() => void remove({ postId: post._id })}
              className="text-[0.6875rem] opacity-50 hover:opacity-100"
              aria-label="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
