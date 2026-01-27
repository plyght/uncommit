import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import sodium from "libsodium-wrappers";

export const fetchUserRepos = action({
  args: {},
  handler: async (ctx): Promise<Array<{ owner: string; name: string; fullName: string }>> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.runQuery(internal.users.getUserWithToken);
    if (!user || !user.githubAccessToken) {
      throw new Error("No GitHub access token found");
    }

    const accessToken: string = user.githubAccessToken;

    const response: Response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
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

    const repos: Array<{ owner: { login: string }; name: string; full_name: string }> = await response.json();
    
    return repos.map((repo) => ({
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
    }));
  },
});

export const fetchRepoPublicKey = action({
  args: {
    owner: v.string(),
    repo: v.string(),
  },
  handler: async (ctx, { owner, repo }): Promise<{ key: string; keyId: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.runQuery(internal.users.getUserWithToken);
    if (!user || !user.githubAccessToken) {
      throw new Error("No GitHub access token found");
    }

    const accessToken: string = user.githubAccessToken;

    const response: Response = await fetch(
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

    const data: { key: string; key_id: string } = await response.json();
    return { key: data.key, keyId: data.key_id };
  },
});

export const fetchRepoPublicKeyForClient = action({
  args: {
    owner: v.string(),
    repo: v.string(),
  },
  handler: async (ctx, { owner, repo }): Promise<{ key: string; keyId: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.runQuery(internal.users.getUserWithToken);
    if (!user || !user.githubAccessToken) {
      throw new Error("No GitHub access token found");
    }

    const accessToken: string = user.githubAccessToken;

    const response: Response = await fetch(
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

    const data: { key: string; key_id: string } = await response.json();
    return { key: data.key, keyId: data.key_id };
  },
});

export const createRepoSecret = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    secretName: v.string(),
    encryptedValue: v.string(),
    keyId: v.string(),
  },
  handler: async (ctx, { owner, repo, secretName, encryptedValue, keyId }): Promise<{ success: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.runQuery(internal.users.getUserWithToken);
    if (!user || !user.githubAccessToken) {
      throw new Error("No GitHub access token found");
    }

    const accessToken: string = user.githubAccessToken;

    const response: Response = await fetch(
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
      const error: string = await response.text();
      throw new Error(`Failed to create secret: ${error}`);
    }

    return { success: true };
  },
});

export const createWorkflowFile = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    content: v.string(),
    aiProvider: v.string(),
  },
  handler: async (ctx, { owner, repo, content, aiProvider }): Promise<{ success: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.runQuery(internal.users.getUserWithToken);
    if (!user || !user.githubAccessToken) {
      throw new Error("No GitHub access token found");
    }

    const accessToken: string = user.githubAccessToken;

    await sodium.ready;

    const path = ".github/workflows/ai-release.yml";
    const message = `Add AI release notes workflow (${aiProvider})`;

    let existingSha: string | undefined;
    const getResponse: Response = await fetch(
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
      const existing: { sha: string } = await getResponse.json();
      existingSha = existing.sha;
    }

    const putResponse: Response = await fetch(
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
          content: sodium.to_base64(sodium.from_string(content), sodium.base64_variants.ORIGINAL),
          ...(existingSha && { sha: existingSha }),
        }),
      }
    );

    if (!putResponse.ok) {
      const error: string = await putResponse.text();
      throw new Error(`Failed to create workflow file: ${error}`);
    }

    return { success: true };
  },
});
