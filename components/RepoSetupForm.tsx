import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { RadioGroup } from "@/components/RadioGroup";

type RepoSetupFormProps = {
  selectedRepo: string;
  onSelectedRepoChange: (value: string) => void;
  onSaved?: (repoFullName: string) => void;
};

export function RepoSetupForm({
  selectedRepo,
  onSelectedRepoChange,
  onSaved,
}: RepoSetupFormProps) {
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.users.getCurrentUser);
  const subscription = useQuery(api.users.getCurrentUserSubscription);
  const fetchRepos = useAction(api.github.fetchUserRepos);
  const saveRepoSettings = useMutation(api.repos.saveRepoSettings);
  const userRepos = useQuery(api.repos.getUserRepos);

  const [repos, setRepos] = useState<Array<{ owner: string; name: string; fullName: string; id?: number }>>([]);
  const [planType, setPlanType] = useState<"free" | "paid">("free");
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
    if (currentUser) {
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
     } else {
       setLoadingRepos(false);
       setRepos([]);
       setSetupSaved(false);
       setMessage(null);
     }
  }, [currentUser, fetchRepos, signOut]);

  useEffect(() => {
    if (!selectedRepo || !userRepos) {
      setPlanType("free");
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
      setPlanType((selected.planType as "free" | "paid") ?? "free");
      setCustomDomain(selected.customDomain ?? "");
      setVersionStrategy((selected.versionStrategy as "any" | "major-only") ?? "any");
      setPublishMode((selected.publishMode as "auto" | "draft") ?? "draft");
      setVersionSource((selected.versionSource as "auto" | "uncommit") ?? "auto");
      setSetupSaved(true);
    } else {
      setPlanType("free");
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
      await saveRepoSettings({
        githubRepoId: selected?.id,
        repoOwner: owner,
        repoName: name,
        planType,
        customDomain: planType === "paid" ? customDomain : undefined,
        versionStrategy,
        versionSource,
        publishMode,
      });
      setMessage({ type: "success", text: "Setup saved. Install the GitHub App to start monitoring." });
      setSetupSaved(true);
      onSaved?.(selectedRepo);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save setup",
      });
    } finally {
      setLoading(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[0.75rem] opacity-50">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Repository</label>
          {loadingRepos ? (
            <p className="text-[0.75rem] opacity-50">Loading repositories…</p>
          ) : (
            <Select
              items={repoItems}
              value={selectedRepo}
              onValueChange={(value) => {
                onSelectedRepoChange(value);
                setSetupSaved(false);
              }}
              placeholder="Select a repository"
              disabled={loading}
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Plan</label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              type="button"
              className={`relative flex flex-col gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-3 text-left text-[0.75rem] transition-colors hover:border-[var(--fg)] ${planType === "paid" ? "border-[var(--accent)]" : ""}`}
              onClick={() => {
                setPlanType("paid");
                setSetupSaved(false);
              }}
            >
              <div className="text-[0.8rem] font-semibold">Pay $15/mo</div>
              <div className="text-[0.6875rem] opacity-50">Custom domain + analytics</div>
              {planType === "paid" && <Checkmark />}
            </button>
            <button
              type="button"
              className={`relative flex flex-col gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-3 text-left text-[0.75rem] transition-colors hover:border-[var(--fg)] ${planType === "free" ? "border-[var(--accent)]" : ""}`}
              onClick={() => {
                setPlanType("free");
                setSetupSaved(false);
              }}
            >
              <div className="text-[0.8rem] font-semibold">Continue free</div>
              <div className="text-[0.6875rem] opacity-50">Hosted slug only</div>
              {planType === "free" && <Checkmark />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Changelog domain</label>
          {planType === "paid" ? (
            <>
              <Input
                value={customDomain}
                onChange={(e) => {
                  setCustomDomain(e.target.value);
                  setSetupSaved(false);
                }}
                placeholder="changelog.yourdomain.com"
                disabled={loading || !subscription?.isActive}
                className={!subscription?.isActive ? "opacity-50" : ""}
              />
              {!subscription?.isActive && (
                <div className="text-[0.6875rem] leading-relaxed opacity-75">
                  Custom domains require a paid plan.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      paymentPopup.current = window.open("https://ko-fi.com/summary/184d3369-9f68-4a3a-8094-d1310fb4263b", "kofi", "width=480,height=720,left=200,top=100");
                    }}
                    className="underline underline-offset-4"
                  >
                    Upgrade here
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-[0.6875rem] leading-relaxed opacity-50">
              Free plan uses a slug like{" "}
              <code className="border border-[var(--border)] bg-[var(--gray-100)] px-1 py-0.5 text-[0.625rem]">
                /{selectedRepo.split("/")[1] || "repo"}-x1y2z3
              </code>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Version trigger</label>
          <RadioGroup
            items={[
              { value: "any", label: "Every version increase" },
              { value: "major-only", label: "Major versions only" },
            ]}
            value={versionStrategy}
            onValueChange={(val) => {
              setVersionStrategy(val as "any" | "major-only");
              setSetupSaved(false);
            }}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Publish mode</label>
          <RadioGroup
            items={[
              { value: "auto", label: "Auto-publish changelogs" },
              { value: "draft", label: "Draft and review" },
            ]}
            value={publishMode}
            onValueChange={(val) => {
              setPublishMode(val as "auto" | "draft");
              setSetupSaved(false);
            }}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Version source</label>
          <RadioGroup
            items={[
              { value: "auto", label: "Auto-detect (package.json, Cargo.toml, etc.)" },
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
            className={`rounded-[var(--radius)] border px-3 py-2 text-[0.75rem] ${
              message.type === "success"
                ? "border-[var(--success)] text-[var(--success)]"
                : "border-[var(--error)] text-[var(--error)]"
            }`}
          >
            {message.text}
          </div>
        )}

        <Button onClick={handleSave} disabled={!selectedRepo || loading} fullWidth>
          {loading ? "Saving…" : "Save setup"}
        </Button>

        {setupSaved && (
          <div className="text-[0.6875rem] leading-relaxed opacity-50">
            {installUrl ? (
              <>
                Install the GitHub App to start monitoring.{" "}
                <a href={installUrl} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">
                  Install now
                </a>
              </>
            ) : (
              "Set NEXT_PUBLIC_GITHUB_APP_INSTALL_URL to show the installation link."
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Checkmark() {
  return (
    <span className="absolute right-3 top-3 text-[var(--accent)]">
      <svg width="12" height="12" viewBox="0 0 10 10" fill="currentColor">
        <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
      </svg>
    </span>
  );
}
