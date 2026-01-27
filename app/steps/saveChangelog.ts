import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

type SavePayload = {
  repoId: string;
  version: string;
  markdown: string;
  publishMode: string;
};

const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("CONVEX_URL or NEXT_PUBLIC_CONVEX_URL is required");
}

const client = new ConvexHttpClient(convexUrl);

export async function saveChangelogStep({ repoId, version, markdown, publishMode }: SavePayload) {
  "use step";

  const status = publishMode === "auto" ? "published" : "draft";
  const title = `v${version}`;

  const result = await client.mutation(api.changelogs.createChangelog, {
    repoId,
    version,
    title,
    markdown,
    status,
  });

  return { postId: result.id, postSlug: result.slug };
}
