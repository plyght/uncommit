import { headers } from "next/headers";
import { PublicChangelogList } from "@/components/PublicChangelogList";
import { PublicChangelogPost } from "@/components/PublicChangelogPost";

export default function SlugPage({ params }: { params: { slug: string } }) {
  const host = headers().get("host")?.split(":")[0] ?? "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;

  if (host && appDomain && host !== appDomain) {
    return <PublicChangelogPost customDomain={host} postSlug={params.slug} />;
  }

  return <PublicChangelogList slug={params.slug} />;
}
