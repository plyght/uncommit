import { detectVersionStep } from "@/app/steps/detectVersion";
import { postGitHubCommentStep } from "@/app/steps/postGitHubComment";
import { fetchDiffStep } from "@/app/steps/fetchDiff";
import { generateChangelogStep } from "@/app/steps/generateChangelog";
import { saveChangelogStep } from "@/app/steps/saveChangelog";
import { updateGitHubCommentStep } from "@/app/steps/updateGitHubComment";

type WorkflowPayload = {
  repoId: string;
  githubRepoId: number;
  repoOwner: string;
  repoName: string;
  installationId?: number;
  beforeSha: string;
  afterSha: string;
  versionSource: string;
  versionStrategy: string;
  publishMode: string;
  planType: string;
  slug: string;
  customDomain?: string;
};

export async function changelogWorkflow(payload: WorkflowPayload) {
  "use workflow";

  const detection = await detectVersionStep(payload);
  if (!detection.shouldRelease || !detection.version) {
    return { skipped: true };
  }

  const comment = await postGitHubCommentStep({
    installationId: payload.installationId,
    repoOwner: payload.repoOwner,
    repoName: payload.repoName,
    commitSha: payload.afterSha,
    version: detection.version,
  });

  const diff = await fetchDiffStep({
    installationId: payload.installationId,
    repoOwner: payload.repoOwner,
    repoName: payload.repoName,
    baseSha: payload.beforeSha,
    headSha: payload.afterSha,
  });

  const markdown = await generateChangelogStep({
    version: detection.version,
    diff,
  });

  const saved = await saveChangelogStep({
    repoId: payload.repoId,
    version: detection.version,
    markdown,
    publishMode: payload.publishMode,
  });

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "";
  const publicLink =
    payload.publishMode === "auto"
      ? payload.customDomain
        ? `https://${payload.customDomain}/${saved.postSlug}`
        : `${appBaseUrl}/${payload.slug}/${saved.postSlug}`
      : `${appBaseUrl}/dashboard/edit/${saved.postId}`;

  await updateGitHubCommentStep({
    installationId: payload.installationId,
    commentId: comment.commentId,
    repoOwner: payload.repoOwner,
    repoName: payload.repoName,
    link: publicLink,
    publishMode: payload.publishMode,
  });

  return { ok: true, link: publicLink };
}
