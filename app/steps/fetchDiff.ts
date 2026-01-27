import { getInstallationOctokit } from "@/lib/githubApp";

type DiffPayload = {
  installationId?: number;
  repoOwner: string;
  repoName: string;
  baseSha: string;
  headSha: string;
};

export async function fetchDiffStep(payload: DiffPayload) {
  "use step";

  if (!payload.installationId) {
    throw new Error("Missing installationId");
  }

  const octokit = await getInstallationOctokit(payload.installationId);
  const response = await octokit.request("GET /repos/{owner}/{repo}/compare/{base}...{head}", {
    owner: payload.repoOwner,
    repo: payload.repoName,
    base: payload.baseSha,
    head: payload.headSha,
  });

  const files = response.data.files ?? [];
  const patches = files
    .map((file) => {
      if (!file.patch) return null;
      return `# ${file.filename}\n${file.patch}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return patches.slice(0, 80000);
}
