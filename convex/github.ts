import { action } from "./_generated/server";
import { v } from "convex/values";

export const fetchUserRepos = action({
  args: { accessToken: v.string() },
  handler: async (_, { accessToken }) => {
    const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("TOKEN_REVOKED");
      }
      throw new Error("Failed to fetch repositories");
    }

    const repos = await response.json();
    
    return repos.map((repo: { id: number; owner: { login: string }; name: string; full_name: string }) => ({
      id: repo.id,
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
    }));
  },
});

export const fetchRepoPublicKey = action({
  args: {
    accessToken: v.string(),
    owner: v.string(),
    repo: v.string(),
  },
  handler: async (_, { accessToken, owner, repo }) => {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch repository public key");
    }

    const data = await response.json();
    return { key: data.key, keyId: data.key_id };
  },
});

export const createRepoSecret = action({
  args: {
    accessToken: v.string(),
    owner: v.string(),
    repo: v.string(),
    secretName: v.string(),
    encryptedValue: v.string(),
    keyId: v.string(),
  },
  handler: async (_, { accessToken, owner, repo, secretName, encryptedValue, keyId }) => {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secretName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          encrypted_value: encryptedValue,
          key_id: keyId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create secret: ${error}`);
    }

    return { success: true };
  },
});

export const createWorkflowFile = action({
  args: {
    accessToken: v.string(),
    owner: v.string(),
    repo: v.string(),
    content: v.string(),
    aiProvider: v.string(),
  },
  handler: async (_, { accessToken, owner, repo, content, aiProvider }) => {
    const path = ".github/workflows/ai-release.yml";
    const message = `Add AI release notes workflow (${aiProvider})`;

    let existingSha: string | undefined;
    const getResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (getResponse.ok) {
      const existing = await getResponse.json();
      existingSha = existing.sha;
    }

    const putResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString("base64"),
          ...(existingSha && { sha: existingSha }),
        }),
      }
    );

    if (!putResponse.ok) {
      const error = await putResponse.text();
      throw new Error(`Failed to create workflow file: ${error}`);
    }

    return { success: true };
  },
});
