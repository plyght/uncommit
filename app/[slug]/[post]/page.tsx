import { PublicChangelogPost } from "@/components/PublicChangelogPost";

export default async function PostPage({ params }: { params: Promise<{ slug: string; post: string }> }) {
  const { slug, post } = await params;
  return <PublicChangelogPost slug={slug} postSlug={post} />;
}
