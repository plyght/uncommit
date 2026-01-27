"use client";

import { useState, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";

export default function Home() {
  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <h1 className="logo">&lt;uncommit/&gt;</h1>
          <p className="tagline">AI-generated release notes from your code</p>
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
        <a href="/about" className="field-link">What is this?</a>
      </p>
    </div>
  );
}

function SetupSection() {
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.users.getCurrentUser);
  const fetchRepos = useAction(api.github.fetchUserRepos);
  const installWorkflow = useAction(api.install.installWorkflow);

  const [repos, setRepos] = useState<Array<{ owner: string; name: string; fullName: string }>>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [aiProvider, setAiProvider] = useState<"openai" | "anthropic">("openai");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (currentUser?.githubAccessToken) {
      setLoadingRepos(true);
      fetchRepos({ accessToken: currentUser.githubAccessToken })
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

  const handleInstall = async () => {
    if (!selectedRepo || !apiKey) return;

    setLoading(true);
    setMessage(null);

    const [owner, name] = selectedRepo.split("/");

    try {
      await installWorkflow({
        repoOwner: owner,
        repoName: name,
        aiProvider,
        apiKey,
      });
      setMessage({ type: "success", text: "Workflow installed successfully!" });
      setSelectedRepo("");
      setApiKey("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Installation failed",
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

  return (
    <div className="section">
      <div className="form">
        <div className="field">
          <label className="label">API Key</label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Enter your ${aiProvider === "openai" ? "OpenAI" : "Anthropic"} API key`}
            disabled={loading}
          />
          <p className="field-hint">
            * Encrypted before storing in GitHub Secrets.{" "}
            <a
              href={selectedRepo 
                ? `https://github.com/${selectedRepo}/settings/secrets/actions/new`
                : "https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="field-link"
            >
              Add it yourself
            </a>{" "}
            as <code className="field-code">{aiProvider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"}</code>
          </p>
        </div>

        <div className="field">
          <label className="label">Provider</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="openai"
                checked={aiProvider === "openai"}
                onChange={() => setAiProvider("openai")}
                disabled={loading}
              />
              <span>OpenAI</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="anthropic"
                checked={aiProvider === "anthropic"}
                onChange={() => setAiProvider("anthropic")}
                disabled={loading}
              />
              <span>Anthropic</span>
            </label>
          </div>
        </div>

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

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <Button
          onClick={handleInstall}
          disabled={!selectedRepo || !apiKey || loading}
          fullWidth
        >
          {loading ? "Installing..." : "Install Workflow"}
        </Button>
        <p className="field-hint" style={{ textAlign: "center", marginTop: "1rem" }}>
          <a href="/about" className="field-link">What is this?</a>
        </p>
      </div>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ marginRight: "0.5rem" }}
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
