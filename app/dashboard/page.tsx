"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const userInstallations = useQuery(api.users.getUserInstallations);
  const fetchRepos = useAction(api.github.fetchUserRepos);
  const installWorkflow = useAction(api.install.installWorkflow);

  const [repos, setRepos] = useState<Array<{ owner: string; name: string; fullName: string }>>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [aiProvider, setAiProvider] = useState<"openai" | "anthropic">("openai");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (currentUser?.githubAccessToken) {
      fetchRepos({ accessToken: currentUser.githubAccessToken })
        .then(setRepos)
        .catch(() => {
          setMessage({ type: "error", text: "Failed to fetch repositories" });
        });
    }
  }, [currentUser, fetchRepos]);

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
      setMessage({ type: "success", text: "Workflow installed successfully" });
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

  if (isLoading || currentUser === undefined) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.heading}>uncommit</h1>

        <div style={styles.section}>
          <h2 style={styles.subheading}>Install Workflow</h2>

          <div style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Repository</label>
              <Select
                value={selectedRepo}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRepo(e.target.value)}
                disabled={loading}
              >
                <option value="">Select a repository</option>
                {repos.map((repo) => (
                  <option key={repo.fullName} value={repo.fullName}>
                    {repo.fullName}
                  </option>
                ))}
              </Select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>AI Provider</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="openai"
                    checked={aiProvider === "openai"}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAiProvider(e.target.value as "openai")
                    }
                    disabled={loading}
                  />
                  <span style={styles.radioText}>OpenAI</span>
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    value="anthropic"
                    checked={aiProvider === "anthropic"}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAiProvider(e.target.value as "anthropic")
                    }
                    disabled={loading}
                  />
                  <span style={styles.radioText}>Anthropic</span>
                </label>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>API Key</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                placeholder={`Enter your ${aiProvider === "openai" ? "OpenAI" : "Anthropic"} API key`}
                disabled={loading}
              />
            </div>

            {message && (
              <div
                style={{
                  ...styles.message,
                  color: message.type === "error" ? "var(--error)" : "var(--success)",
                }}
              >
                {message.text}
              </div>
            )}

            <Button onClick={handleInstall} disabled={!selectedRepo || !apiKey || loading} fullWidth>
              {loading ? "Installing..." : "Install"}
            </Button>
          </div>
        </div>

        {userInstallations && userInstallations.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.subheading}>Installed Workflows</h2>
            <div style={styles.list}>
              {userInstallations.map((installation) => (
                <div key={installation._id} style={styles.listItem}>
                  <div>
                    <strong>
                      {installation.repoOwner}/{installation.repoName}
                    </strong>
                  </div>
                  <div style={styles.meta}>{installation.aiProvider}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    padding: "2rem",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "3rem",
  },
  section: {
    marginBottom: "3rem",
  },
  subheading: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.5rem",
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  radioGroup: {
    display: "flex",
    gap: "1.5rem",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
  },
  radioText: {
    fontSize: "0.875rem",
  },
  message: {
    padding: "0.75rem",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    fontSize: "0.875rem",
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  listItem: {
    padding: "1rem",
    border: "1px solid var(--border)",
    borderRadius: "4px",
  },
  meta: {
    fontSize: "0.875rem",
    opacity: 0.6,
    marginTop: "0.25rem",
  },
};
