import { PublicChangelogPost } from "@/components/PublicChangelogPost";

export default function PostPage({ params }: { params: { slug: string; post: string } }) {
  return <PublicChangelogPost slug={params.slug} postSlug={params.post} />;
}
