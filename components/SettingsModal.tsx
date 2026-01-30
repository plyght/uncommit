"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { RadioGroup } from "@/components/RadioGroup";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
  selectedRepo: string;
  onSelectedRepoChange: (value: string) => void;
  mode?: "add" | "edit";
};

export function SettingsModal({
  open,
  onClose,
  selectedRepo,
  onSelectedRepoChange,
  mode = "edit",
}: SettingsModalProps) {
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.users.getCurrentUser);
  const subscription = useQuery(api.users.getCurrentUserSubscription);
  const fetchRepos = useAction(api.github.fetchUserRepos);
  const saveRepoSettings = useMutation(api.repos.saveRepoSettings);
  const userRepos = useQuery(api.repos.getUserRepos);

  const [repos, setRepos] = useState<Array<{ owner: string; name: string; fullName: string; id?: number }>>([]);
  const [customDomain, setCustomDomain] = useState("");
  const [versionStrategy, setVersionStrategy] = useState<"any" | "major-only">("any");
  const [publishMode, setPublishMode] = useState<"auto" | "draft">("draft");
  const [versionSource, setVersionSource] = useState<"auto" | "uncommit">("auto");
  const [loading, setLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [setupSaved, setSetupSaved] = useState(false);
  const paymentPopup = useRef<Window | null>(null);

  useEffect(() => {
    if (subscription?.isActive && paymentPopup.current && !paymentPopup.current.closed) {
      paymentPopup.current.close();
      paymentPopup.current = null;
    }
  }, [subscription?.isActive]);

  useEffect(() => {
    if (currentUser && open) {
      setLoadingRepos(true);
      fetchRepos({})
        .then(setRepos)
        .catch((err) => {
          if (err instanceof Error && err.message.includes("TOKEN_REVOKED")) {
            void signOut();
            return;
          }
          setMessage({ type: "error", text: "Failed to fetch repositories" });
        })
        .finally(() => setLoadingRepos(false));
    } else if (!currentUser) {
      setLoadingRepos(false);
      setRepos([]);
      setSetupSaved(false);
      setMessage(null);
    }
  }, [currentUser, fetchRepos, signOut, open]);

  useEffect(() => {
    if (!selectedRepo || !userRepos) {
      setCustomDomain("");
      setVersionStrategy("any");
      setPublishMode("draft");
      setVersionSource("auto");
      return;
    }

    const selected = userRepos.find(
      (repo) => `${repo.repoOwner}/${repo.repoName}` === selectedRepo
    );

    if (selected) {
      setCustomDomain(selected.customDomain ?? "");
      setVersionStrategy((selected.versionStrategy as "any" | "major-only") ?? "any");
      setPublishMode((selected.publishMode as "auto" | "draft") ?? "draft");
      setVersionSource((selected.versionSource as "auto" | "uncommit") ?? "auto");
      setSetupSaved(true);
    } else {
      setCustomDomain("");
      setVersionStrategy("any");
      setPublishMode("draft");
      setVersionSource("auto");
      setSetupSaved(false);
    }
  }, [selectedRepo, userRepos]);

  const repoItems = useMemo(
    () =>
      [...repos]
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .map((repo) => ({
          value: repo.fullName,
          label: repo.fullName,
        })),
    [repos]
  );

  const installUrl = process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL;

  const handleSave = async () => {
    if (!selectedRepo) return;
    setLoading(true);
    setMessage(null);

    const [owner, name] = selectedRepo.split("/");
    const selected = repos.find((repo) => repo.fullName === selectedRepo);
    try {
      const hasPaidFeatures = subscription?.isActive && customDomain;
      await saveRepoSettings({
        githubRepoId: selected?.id,
        repoOwner: owner,
        repoName: name,
        planType: hasPaidFeatures ? "paid" : "free",
        customDomain: subscription?.isActive ? customDomain : undefined,
        versionStrategy,
        versionSource,
        publishMode,
      });
      setMessage({ type: "success", text: "Settings saved." });
      setSetupSaved(true);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--fg)]/20 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[100dvh] w-full max-w-[480px] overflow-y-auto border border-[var(--border)] bg-[var(--bg)] p-4 shadow-lg sm:max-h-[90vh] sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 p-1 opacity-50 hover:opacity-100 sm:right-4 sm:top-4"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        <h2 className="mb-4 text-[0.9375rem] font-semibold sm:mb-6 sm:text-[1rem]">
          {mode === "add" ? "Add repository" : "Settings"}
        </h2>

        <div className="flex flex-col gap-4 sm:gap-5">
          {mode === "add" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.625rem] font-medium uppercase tracking-[0.05em] opacity-50 sm:text-[0.6875rem]">Repository</label>
                {loadingRepos ? (
                  <p className="text-[0.75rem] opacity-50">Loading repositories…</p>
                ) : (
                  <Select
                    items={repoItems}
                    value={selectedRepo}
                    onValueChange={(value) => {
                      onSelectedRepoChange(value);
                      setSetupSaved(false);
                      setMessage(null);
                    }}
                    placeholder="Select a repository"
                    disabled={loading}
                  />
                )}
              </div>

              {message && (
                <div
                  className={`border px-3 py-2 text-[0.75rem] ${
                    message.type === "success"
                      ? "border-[var(--success)] text-[var(--success)]"
                      : "border-[var(--error)] text-[var(--error)]"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button
                onClick={handleSave}
                disabled={!selectedRepo || loading}
                fullWidth
              >
                {loading ? "Adding…" : "Add repository"}
              </Button>

              {setupSaved && installUrl && (
                <div className="text-[0.6875rem] leading-relaxed opacity-50">
                  <a href={installUrl} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">
                    Install GitHub App
                  </a>{" "}
                  to start monitoring. Configure settings via the gear icon.
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-[0.75rem] opacity-50 sm:text-[0.8125rem]">{selectedRepo}</div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.625rem] font-medium uppercase tracking-[0.05em] opacity-50 sm:text-[0.6875rem]">Custom domain</label>
                {subscription?.isActive ? (
                  <Input
                    value={customDomain}
                    onChange={(e) => {
                      setCustomDomain(e.target.value);
                      setSetupSaved(false);
                    }}
                    placeholder="changelog.yourdomain.com"
                    disabled={loading}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const w = 480, h = 720;
                      const left = (screen.width - w) / 2;
                      const top = (screen.height - h) / 2;
                      paymentPopup.current = window.open("https://ko-fi.com/summary/184d3369-9f68-4a3a-8094-d1310fb4263b", "kofi", `width=${w},height=${h},left=${left},top=${top}`);
                    }}
                    className="flex h-10 items-center justify-between border border-[var(--border)] bg-[var(--card-bg)] px-3 text-[0.75rem] opacity-60 transition-opacity hover:opacity-100 sm:h-9"
                  >
                    <span className="opacity-50">Upgrade to use custom domain</span>
                    <span>$15/mo →</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[0.625rem] font-medium uppercase tracking-[0.05em] opacity-50 sm:text-[0.6875rem]">
                  Version trigger
                  <Hint text="Trigger on every bump, or major versions only (1.0 → 2.0)" />
                </label>
                <RadioGroup
                  items={[
                    { value: "any", label: "Every version" },
                    { value: "major-only", label: "Major only" },
                  ]}
                  value={versionStrategy}
                  onValueChange={(val) => {
                    setVersionStrategy(val as "any" | "major-only");
                    setSetupSaved(false);
                  }}
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[0.625rem] font-medium uppercase tracking-[0.05em] opacity-50 sm:text-[0.6875rem]">
                  Publish mode
                  <Hint text="Publish immediately or save as draft to review first" />
                </label>
                <RadioGroup
                  items={[
                    { value: "auto", label: "Auto-publish" },
                    { value: "draft", label: "Draft first" },
                  ]}
                  value={publishMode}
                  onValueChange={(val) => {
                    setPublishMode(val as "auto" | "draft");
                    setSetupSaved(false);
                  }}
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[0.625rem] font-medium uppercase tracking-[0.05em] opacity-50 sm:text-[0.6875rem]">
                  Version source
                  <Hint text="Reads package.json, Cargo.toml, pyproject.toml, Version.swift, etc. or specify in uncommit.json" />
                </label>
                <RadioGroup
                  items={[
                    { value: "auto", label: "Auto-detect" },
                    { value: "uncommit", label: "uncommit.json" },
                  ]}
                  value={versionSource}
                  onValueChange={(val) => {
                    setVersionSource(val as "auto" | "uncommit");
                    setSetupSaved(false);
                  }}
                  disabled={loading}
                />
              </div>

              {message && (
                <div
                  className={`border px-3 py-2 text-[0.75rem] ${
                    message.type === "success"
                      ? "border-[var(--success)] text-[var(--success)]"
                      : "border-[var(--error)] text-[var(--error)]"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button
                onClick={handleSave}
                disabled={!selectedRepo || loading}
                fullWidth
              >
                {loading ? "Saving…" : "Save"}
              </Button>

              {installUrl && (
                <div className="text-[0.6875rem] leading-relaxed opacity-50">
                  <a href={installUrl} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">
                    Install GitHub App
                  </a>{" "}
                  to start monitoring.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Checkmark() {
  return (
    <span className="absolute right-2 top-2 text-[var(--accent)]">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
      </svg>
    </span>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <span className="group relative cursor-help">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="opacity-30 transition-opacity group-hover:opacity-60">
        <path d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0Zm1 12H7V7h2Zm0-6H7V4h2Z" />
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-48 -translate-x-1/2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-[0.625rem] font-normal normal-case leading-relaxed tracking-normal opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}
