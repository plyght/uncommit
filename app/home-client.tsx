"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";

export default function HomeClient() {
  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <h1 className="logo">&lt;uncommit/&gt;</h1>
          <p className="tagline">AI-generated changelogs from your code</p>
        </header>

        <Unauthenticated>
          <LoginSection />
        </Unauthenticated>

        <Authenticated>
          <SetupSection />
        </Authenticated>
      </div>
    </main>
  );
}

function LoginSection() {
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

  return (
    <div className="section">
      <Button onClick={() => void handleSignIn()}>
        <GitHubIcon />
        Sign in with GitHub
      </Button>
      <p className="field-hint" style={{ textAlign: "center", marginTop: "1rem" }}>
        <Link href="/about" className="field-link">
          What is this?
        </Link>
      </p>
    </div>
  );
}

function SetupSection() {
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.users.getCurrentUser);
  const fetchRepos = useAction(api.github.fetchUserRepos);
  const saveRepoSettings = useMutation(api.repos.saveRepoSettings);
  const userRepos = useQuery(api.repos.getUserRepos);

  const [repos, setRepos] = useState<Array<{ owner: string; name: string; fullName: string; id?: number }>>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [planType, setPlanType] = useState<"free" | "paid">("free");
  const [customDomain, setCustomDomain] = useState("");
  const [versionStrategy, setVersionStrategy] = useState<"any" | "major-only">("any");
  const [publishMode, setPublishMode] = useState<"auto" | "draft">("draft");
  const [versionSource, setVersionSource] = useState<"auto" | "uncommit">("auto");
  const [loading, setLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    }
  }, [currentUser, fetchRepos, signOut]);

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
      <div className="section">
        <p className="loading">Loading...</p>
      </div>
    );
  }

  const repoItems = [...repos]
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((repo) => ({
      value: repo.fullName,
      label: repo.fullName,
    }));

  const installUrl = process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL;

  return (
    <div className="section">
      <div className="form">
        <div className="field">
          <label className="label">Repository</label>
          {loadingRepos ? (
            <p className="loading-small">Loading repositories...</p>
          ) : (
            <Select
              items={repoItems}
              value={selectedRepo}
              onValueChange={setSelectedRepo}
              placeholder="Select a repository"
              disabled={loading}
            />
          )}
        </div>

        <div className="field">
          <label className="label">Plan</label>
          <div className="plan-grid">
            <button
              type="button"
              className={`plan-card ${planType === "paid" ? "selected" : ""}`}
              onClick={() => setPlanType("paid")}
            >
              <div className="plan-title">Pay $15/mo</div>
              <div className="plan-meta">Custom domain + analytics</div>
              {planType === "paid" && <Checkmark />}
            </button>
            <button
              type="button"
              className={`plan-card ${planType === "free" ? "selected" : ""}`}
              onClick={() => setPlanType("free")}
            >
              <div className="plan-title">Continue free</div>
              <div className="plan-meta">Hosted slug only</div>
              {planType === "free" && <Checkmark />}
            </button>
          </div>
        </div>

        <div className="field">
          <label className="label">Changelog domain</label>
          {planType === "paid" ? (
            <Input
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="changelog.yourdomain.com"
              disabled={loading}
            />
          ) : (
            <div className="field-hint">
              Free plan uses a slug like <code className="field-code">/{selectedRepo.split("/")[1] || "repo"}-x1y2z3</code>
            </div>
          )}
        </div>

        <div className="field">
          <label className="label">Version trigger</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="any"
                checked={versionStrategy === "any"}
                onChange={() => setVersionStrategy("any")}
                disabled={loading}
              />
              <span>Every version increase</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="major-only"
                checked={versionStrategy === "major-only"}
                onChange={() => setVersionStrategy("major-only")}
                disabled={loading}
              />
              <span>Major versions only</span>
            </label>
          </div>
        </div>

        <div className="field">
          <label className="label">Publish mode</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="auto"
                checked={publishMode === "auto"}
                onChange={() => setPublishMode("auto")}
                disabled={loading}
              />
              <span>Auto-publish changelogs</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="draft"
                checked={publishMode === "draft"}
                onChange={() => setPublishMode("draft")}
                disabled={loading}
              />
              <span>Draft and review</span>
            </label>
          </div>
        </div>

        <div className="field">
          <label className="label">Version source</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="auto"
                checked={versionSource === "auto"}
                onChange={() => setVersionSource("auto")}
                disabled={loading}
              />
              <span>Auto-detect (package.json, Cargo.toml, etc.)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="uncommit"
                checked={versionSource === "uncommit"}
                onChange={() => setVersionSource("uncommit")}
                disabled={loading}
              />
              <span>uncommit.json</span>
            </label>
          </div>
        </div>

        {message && <div className={`message ${message.type}`}>{message.text}</div>}

        <Button onClick={handleSave} disabled={!selectedRepo || loading} fullWidth>
          {loading ? "Saving..." : "Save setup"}
        </Button>

        <div className="field-hint">
          {installUrl ? (
            <>
              Install the GitHub App to start monitoring.{" "}
              <a href={installUrl} className="field-link" target="_blank" rel="noopener noreferrer">
                Install now
              </a>
            </>
          ) : (
            "Set NEXT_PUBLIC_GITHUB_APP_INSTALL_URL to show the installation link."
          )}
        </div>

        {userRepos && userRepos.length > 0 && (
          <div className="setup-summary">
            <div className="label">Your repos</div>
            <ul className="setup-list">
              {userRepos.map((repo) => (
                <li key={repo._id}>
                  <span>{repo.repoOwner}/{repo.repoName}</span>
                  <span className="setup-meta">
                    {repo.publishMode === "auto" ? "Auto" : "Draft"} · {repo.versionStrategy}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="field-link">
              Go to dashboard
            </Link>
          </div>
        )}

        <p className="field-hint" style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/about" className="field-link">
            What is this?
          </Link>
        </p>
      </div>
    </div>
  );
}

function Checkmark() {
  return (
    <span className="plan-check">
      <svg width="12" height="12" viewBox="0 0 10 10" fill="currentColor">
        <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
      </svg>
    </span>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "0.5rem" }}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
