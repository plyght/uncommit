"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { MarkdownEditor } from "@/components/MarkdownEditor";

export default function EditChangelogPage() {
  const params = useParams<{ id?: string | string[] }>();
  const postId = useMemo(() => {
    if (!params?.id) return null;
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params]);

  const currentUser = useQuery(api.users.getCurrentUser);
  const data = useQuery(
    api.changelogs.getChangelogForEdit,
    currentUser && postId ? { postId: postId as Id<"changelogs"> } : "skip"
  );
  const updateChangelog = useMutation(api.changelogs.updateChangelog);
  const publish = useMutation(api.changelogs.publishChangelog);
  const unpublish = useMutation(api.changelogs.unpublishChangelog);

  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const publicUrl = useMemo(() => {
    if (!data?.repo || !data?.changelog?.slug) return "";
    const domain = data.repo.customDomain?.trim();
    if (domain) {
      return `https://${domain}/${data.changelog.slug}`;
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    return `${baseUrl}/${data.repo.slug}/${data.changelog.slug}`;
  }, [data]);

  useEffect(() => {
    if (data?.changelog) {
      setTitle(data.changelog.title);
      setMarkdown(data.changelog.markdown);
    }
  }, [data]);

  useEffect(() => {
    setCopyStatus("idle");
  }, [postId]);

  if (!postId) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[900px] text-left">
          <p className="text-[0.75rem] opacity-60">Changelog not found.</p>
        </div>
      </main>
    );
  }

  if (currentUser === undefined || data === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[900px] text-left">
          <p className="text-[0.75rem] opacity-60">Loading...</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[900px] text-left">
          <p className="text-[0.75rem] opacity-60">Sign in to edit changelogs.</p>
          <Link href="/" className="text-[0.75rem] underline underline-offset-4">
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[900px] text-left">
          <p className="text-[0.75rem] opacity-60">Changelog not found.</p>
        </div>
      </main>
    );
  }

  const post = data.changelog;
  const canCopyLink = post.status === "published" && publicUrl.length > 0;

  return (
    <main className="flex min-h-screen items-start justify-center px-6 py-12">
      <div className="w-full max-w-[900px] text-left">
        <header className="mb-8 flex items-center gap-6">
          <Link href="/dashboard" className="text-[0.75rem] opacity-60 hover:opacity-100">
            ← Back
          </Link>
          <div>
            <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em]">Edit changelog</h1>
            <p className="text-[0.85rem] opacity-60">{data.repo.repoOwner}/{data.repo.repoName}</p>
          </div>
        </header>

        <div className="flex flex-col gap-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[0.75rem] uppercase tracking-[0.2em] opacity-60">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[0.75rem] uppercase tracking-[0.2em] opacity-60">Content</label>
              <MarkdownEditor value={markdown} onChange={setMarkdown} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void updateChangelog({ postId: post._id, title, markdown })}>Save</Button>
            {post.status === "published" ? (
              <Button onClick={() => void unpublish({ postId: post._id })}>Unpublish</Button>
            ) : (
              <Button onClick={() => void publish({ postId: post._id })}>Publish</Button>
            )}
            <Button
              className="border border-[var(--border)] bg-transparent text-[var(--fg)] hover:bg-[var(--gray-100)]"
              onClick={async () => {
                if (!canCopyLink) return;
                try {
                  await navigator.clipboard.writeText(publicUrl);
                  setCopyStatus("copied");
                  window.setTimeout(() => setCopyStatus("idle"), 2000);
                } catch {
                  setCopyStatus("error");
                }
              }}
              disabled={!canCopyLink}
            >
              {copyStatus === "copied" ? "Copied!" : copyStatus === "error" ? "Copy failed" : "Copy link"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
