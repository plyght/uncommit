import { headers } from "next/headers";
import { PublicChangelogList } from "@/components/PublicChangelogList";
import { PublicChangelogPost } from "@/components/PublicChangelogPost";

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const headersList = await headers();
  const host = headersList.get("host")?.split(":")[0] ?? "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  const { slug } = await params;

  if (host && appDomain && host !== appDomain) {
    return <PublicChangelogPost customDomain={host} postSlug={slug} />;
  }

  return <PublicChangelogList slug={slug} />;
}
