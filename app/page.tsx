import { headers } from "next/headers";
import HomeClient from "./home-client";
import { PublicChangelogList } from "@/components/PublicChangelogList";

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host")?.split(":")[0] ?? "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;

  if (host && appDomain && host !== appDomain) {
    return <PublicChangelogList customDomain={host} />;
  }

  return <HomeClient />;
}
