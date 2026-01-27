import { getInstallationOctokit } from "@/lib/githubApp";

type UpdatePayload = {
  installationId?: number;
  commentId: number;
  repoOwner: string;
  repoName: string;
  link: string;
  publishMode: string;
};

export async function updateGitHubCommentStep(payload: UpdatePayload) {
  "use step";

  if (!payload.installationId) {
    throw new Error("Missing installationId");
  }

  const octokit = await getInstallationOctokit(payload.installationId);
  const statusLabel = payload.publishMode === "auto" ? "Published" : "Draft ready";
  await octokit.request("PATCH /repos/{owner}/{repo}/comments/{comment_id}", {
    owner: payload.repoOwner,
    repo: payload.repoName,
    comment_id: payload.commentId,
    body: `${statusLabel}: ${payload.link}`,
  });
}
