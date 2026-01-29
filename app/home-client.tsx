"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { SettingsModal } from "@/components/SettingsModal";
import { Skeleton } from "@/components/Skeleton";
import { Settings, Trash2 } from "lucide-react";

const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";

export default function HomeClient() {
  return (
    <>
      <Unauthenticated>
        <LoginPage />
      </Unauthenticated>

      <Authenticated>
        <DashboardPage />
      </Authenticated>
    </>
  );
}

function LoginPage() {
  const { signIn } = useAuthActions();

  const handleSignIn = async () => {
    try {
      const { redirect } = await signIn("github", { redirectTo: "/" });
      if (redirect) {
        window.location.href = redirect.toString();
      }
    } catch {
      // Ignore - connection lost during redirect is expected
    }
  };

  const handleDevSignIn = async () => {
    await signIn("anonymous");
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[520px] text-center">
        <header className="mb-8 sm:mb-10">
          <h1 className="mb-1.5 text-[1.5rem] font-semibold tracking-[-0.02em] sm:mb-2 sm:text-[1.625rem]">&lt;uncommit/&gt;</h1>
          <p className="text-[0.75rem] opacity-50 sm:text-[0.8125rem]">AI-generated changelogs from your code</p>
        </header>

        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <Button onClick={() => void handleSignIn()} className="gap-2">
            <GitHubIcon />
            Sign in with GitHub
          </Button>
          {isDev && (
            <Button onClick={() => void handleDevSignIn()} className="gap-2">
              Dev Login (skip OAuth)
            </Button>
          )}
        </div>

        <div className="flex items-center justify-center pt-6 text-[0.75rem] sm:pt-8">
          <Link href="/about" className="py-1 opacity-50 transition-opacity duration-150 hover:opacity-100">
            What is this? →
          </Link>
        </div>
      </div>
    </main>
  );
}

function DashboardPage() {
  const repos = useQuery(api.repos.getUserRepos);
  const subscription = useQuery(api.users.getCurrentUserSubscription);
  const { signOut } = useAuthActions();
  const [activeRepo, setActiveRepo] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState<"add" | "edit">("edit");
  const [devShowEmpty, setDevShowEmpty] = useState(false);

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
      <main className="flex h-[100dvh] items-center justify-center overflow-hidden p-4 sm:p-6">
        <div className="w-full max-w-[520px] text-center">
          <p className="text-[0.75rem] opacity-50 sm:text-[0.8125rem]">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[520px]">
        <header className="mb-6 text-center sm:mb-10">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] sm:text-[1.625rem]">&lt;uncommit/&gt;</h1>
        </header>

        <div className="flex flex-col gap-4 sm:gap-5">
          {repos.length > 0 && !devShowEmpty ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.625rem] font-medium uppercase tracking-[0.05em] opacity-50 sm:text-[0.6875rem]">Repository</label>
                <div className="flex items-center gap-2">
                  <Select
                    items={projectItems}
                    value={activeRepo}
                    onValueChange={setActiveRepo}
                    placeholder="Select a repository"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsMode("edit");
                      setSettingsOpen(true);
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--card-bg)] text-[var(--fg)] opacity-60 transition-opacity hover:opacity-100 sm:h-9 sm:w-9"
                    aria-label="Settings"
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </div>

              {activeRepoData && (
                <ChangelogList
                  repoId={activeRepoData._id}
                  repoName={`${activeRepoData.repoOwner}/${activeRepoData.repoName}`}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-[0.8125rem] opacity-50">No repositories yet.</p>
              <Button onClick={() => {
                setSettingsMode("add");
                setSettingsOpen(true);
              }}>
                Add repository
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-3 text-[0.6875rem] sm:text-[0.75rem]">
            <button
              type="button"
              onClick={() => void signOut()}
              className="py-1 opacity-50 transition-opacity duration-150 hover:opacity-100"
            >
              ← Log out
            </button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-4">
              {subscription?.isActive ? (
                <span className="opacity-30">Pro</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const w = 480, h = 720;
                    const left = (screen.width - w) / 2;
                    const top = (screen.height - h) / 2;
                    window.open("https://ko-fi.com/summary/184d3369-9f68-4a3a-8094-d1310fb4263b", "kofi", `width=${w},height=${h},left=${left},top=${top}`);
                  }}
                  className="py-1 opacity-50 transition-opacity duration-150 hover:opacity-100"
                >
                  Upgrade →
                </button>
              )}
              {repos.length > 0 && !devShowEmpty && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveRepo("");
                    setSettingsMode("add");
                    setSettingsOpen(true);
                  }}
                  className="py-1 opacity-50 transition-opacity duration-150 hover:opacity-100"
                >
                  Add repo →
                </button>
              )}
              <Link href="/about" className="py-1 opacity-50 transition-opacity duration-150 hover:opacity-100">
                About →
              </Link>
            </div>
          </div>

          {isDev && (
            <div className="mt-6 flex items-center gap-3 border-t border-dashed border-[var(--border)] pt-4">
              <span className="text-[0.625rem] uppercase tracking-wider opacity-30">Dev</span>
              <button
                type="button"
                onClick={() => setDevShowEmpty(!devShowEmpty)}
                className={`rounded-[var(--radius)] border border-[var(--border)] px-2 py-0.5 text-[0.625rem] transition-colors ${devShowEmpty ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "opacity-50 hover:opacity-100"}`}
              >
                Empty state
              </button>
            </div>
          )}
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        selectedRepo={activeRepo}
        onSelectedRepoChange={setActiveRepo}
        mode={settingsMode}
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
          className="flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2.5 sm:px-4 sm:py-3"
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
      <div className="border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <p className="text-[0.8125rem] opacity-50">
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
          className="flex items-center justify-between gap-2 border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3"
        >
          <Link href={`/dashboard/edit/${post._id}`} className="flex min-w-0 flex-col gap-0.5 transition-opacity hover:opacity-70">
            <div className="truncate text-[0.75rem] sm:text-[0.8125rem]">{post.title}</div>
            <div className="flex items-center gap-1.5 text-[0.625rem] sm:gap-2 sm:text-[0.6875rem]">
              <span
                className={`rounded-[var(--radius)] px-1.5 py-0.5 ${
                  post.type === "release"
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "bg-[var(--gray-100)] text-[var(--gray-600)]"
                }`}
              >
                {post.type ?? "changelog"}
              </span>
              <span className="opacity-50">{post.status}</span>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href={`/dashboard/edit/${post._id}`}
              className="hidden text-[0.6875rem] underline underline-offset-4 opacity-70 hover:opacity-100 sm:block"
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
              className="opacity-50 transition-opacity hover:opacity-100"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "0.5rem" }}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
