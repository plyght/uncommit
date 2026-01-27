import { headers } from "next/headers";
import HomeClient from "./home-client";
import { PublicChangelogList } from "@/components/PublicChangelogList";

export default function Home() {
  const host = headers().get("host")?.split(":")[0] ?? "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;

  if (host && appDomain && host !== appDomain) {
    return <PublicChangelogList customDomain={host} />;
  }

  return <HomeClient />;
}
