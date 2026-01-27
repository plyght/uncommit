import { getInstallationOctokit } from "@/lib/githubApp";

type CommentPayload = {
  installationId?: number;
  repoOwner: string;
  repoName: string;
  commitSha: string;
  version: string;
};

export async function postGitHubCommentStep(payload: CommentPayload) {
  "use step";

  if (!payload.installationId) {
    throw new Error("Missing installationId");
  }

  const octokit = await getInstallationOctokit(payload.installationId);
  const response = await octokit.request("POST /repos/{owner}/{repo}/commits/{commit_sha}/comments", {
    owner: payload.repoOwner,
    repo: payload.repoName,
    commit_sha: payload.commitSha,
    body: `Analyzing code differences for v${payload.version} to draft the changelog...`,
  });

  return { commentId: response.data.id };
}
