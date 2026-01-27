import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyGitHubWebhookSignature } from "@/lib/githubApp";
import { start } from "workflow/runtime";
import { changelogWorkflow } from "@/app/workflows/changelog";

export const runtime = "nodejs";

const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("CONVEX_URL or NEXT_PUBLIC_CONVEX_URL is required");
}

const client = new ConvexHttpClient(convexUrl);

export async function POST(req: Request) {
  const signature = headers().get("x-hub-signature-256");
  const event = headers().get("x-github-event");
  const rawBody = await req.text();

  if (!verifyGitHubWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event !== "push") {
    return NextResponse.json({ ok: true });
  }

  const payload = JSON.parse(rawBody) as {
    ref: string;
    before: string;
    after: string;
    repository: { id: number; name: string; owner: { login: string }; default_branch: string };
    installation?: { id: number };
  };

  const branch = payload.ref?.replace("refs/heads/", "");
  if (!branch || branch !== payload.repository.default_branch) {
    return NextResponse.json({ ok: true });
  }

  const repo = await client.query(api.repos.getRepoByGithubRepoId, {
    githubRepoId: payload.repository.id,
  });

  if (!repo) {
    if (payload.installation?.id) {
      await client.mutation(api.repos.bindInstallationToRepo, {
        githubRepoId: payload.repository.id,
        installationId: payload.installation.id,
        repoOwner: payload.repository.owner.login,
        repoName: payload.repository.name,
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (payload.installation?.id && repo.installationId !== payload.installation.id) {
    await client.mutation(api.repos.bindInstallationToRepo, {
      githubRepoId: payload.repository.id,
      installationId: payload.installation.id,
      repoOwner: payload.repository.owner.login,
      repoName: payload.repository.name,
    });
  }

  const installationId = payload.installation?.id ?? repo.installationId;
  if (!installationId) {
    return NextResponse.json({ ok: true, skipped: "missing_installation" });
  }

  await start(changelogWorkflow, [
    {
    repoId: repo._id,
    githubRepoId: payload.repository.id,
    repoOwner: payload.repository.owner.login,
    repoName: payload.repository.name,
    installationId,
    beforeSha: payload.before,
    afterSha: payload.after,
    versionSource: repo.versionSource,
    versionStrategy: repo.versionStrategy,
    publishMode: repo.publishMode,
    planType: repo.planType,
    slug: repo.slug,
    customDomain: repo.customDomain,
    },
  ]);

  return NextResponse.json({ ok: true });
}
