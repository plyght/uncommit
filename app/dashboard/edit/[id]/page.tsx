"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
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
    currentUser && postId ? ({ postId: postId as Id<"changelogs"> } as any) : ("skip" as any)
  );
  const updateChangelog = useMutation(api.changelogs.updateChangelog);
  const publish = useMutation(api.changelogs.publishChangelog);
  const unpublish = useMutation(api.changelogs.unpublishChangelog);

  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [postType, setPostType] = useState<"release" | "changelog">("changelog");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

   const publicUrl = useMemo(() => {
     if (!data?.repo || !data?.changelog?.slug || postType !== "release") return "";
     const domain = data.repo.customDomain?.trim();
     if (domain) {
       return `https://${domain}/${data.changelog.slug}`;
     }
     const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
     return `${baseUrl}/${data.repo.slug}/${data.changelog.slug}`;
   }, [data, postType]);

  useEffect(() => {
    if (data?.changelog) {
      setTitle(data.changelog.title);
      setMarkdown(data.changelog.markdown);
      setPostType((data.changelog.type ?? "changelog") === "release" ? "release" : "changelog");
    }
  }, [data]);

  useEffect(() => {
    setCopyStatus("idle");
  }, [postId]);

  if (!postId) {
    return (
      <main className="flex h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[900px] text-left">
          <p className="text-[0.75rem] opacity-50">Changelog not found.</p>
        </div>
      </main>
    );
  }

  if (currentUser === undefined || data === undefined) {
    return (
      <main className="flex h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[900px] text-left">
          <p className="text-[0.75rem] opacity-50">Loading…</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="flex h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[900px] text-left">
          <p className="text-[0.75rem] opacity-50">Sign in to edit posts.</p>
          <Link href="/" className="text-[0.75rem] underline underline-offset-4">
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[900px] text-left">
          <p className="text-[0.75rem] opacity-50">Changelog not found.</p>
        </div>
      </main>
    );
  }

  const post = data.changelog;
  const canCopyLink = post.status === "published" && publicUrl.length > 0 && postType === "release";

  const typeOptions = [
    { value: "changelog", label: "Changelog (internal)" },
    { value: "release", label: "Release note (public)" },
  ];

  return (
    <main className="flex min-h-[100dvh] items-start justify-center px-4 py-6 sm:px-6 sm:py-12">
      <div className="w-full max-w-[900px] text-left">
        <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-6">
          <Link href="/dashboard" className="text-[0.75rem] opacity-50 transition-opacity hover:opacity-100">
            ← Back
          </Link>
          <div>
            <h1 className="text-[1.25rem] font-semibold tracking-[-0.02em] sm:text-[1.5rem]">Edit post</h1>
            <p className="text-[0.75rem] opacity-50 sm:text-[0.8125rem]">{data.repo.repoOwner}/{data.repo.repoName}</p>
          </div>
        </header>

        <div className="flex flex-col gap-5 border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:gap-6 sm:p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Post type</label>
              <Select items={typeOptions} value={postType} onValueChange={(value) => setPostType(value as "release" | "changelog")} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Content</label>
              <MarkdownEditor value={markdown} onChange={setMarkdown} />
            </div>
          </div>

          {mutationError && (
            <div className="text-[0.75rem] text-red-500">{mutationError}</div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              loading={isSaving}
              onClick={async () => {
                setMutationError(null);
                setIsSaving(true);
                try {
                  await updateChangelog({ postId: post._id, title, markdown, type: postType });
                } catch (error) {
                  console.error("Failed to save changelog:", error);
                  setMutationError(error instanceof Error ? error.message : "Failed to save changelog");
                } finally {
                  setIsSaving(false);
                }
              }}
              aria-label="Save changelog"
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
            {post.status === "published" ? (
              <Button
                loading={isPublishing}
                onClick={async () => {
                  setMutationError(null);
                  setIsPublishing(true);
                  try {
                    await unpublish({ postId: post._id });
                  } catch (error) {
                    console.error("Failed to unpublish:", error);
                    setMutationError(error instanceof Error ? error.message : "Failed to unpublish");
                  } finally {
                    setIsPublishing(false);
                  }
                }}
                aria-label="Unpublish changelog"
              >
                {isPublishing ? "Unpublishing…" : "Unpublish"}
              </Button>
            ) : (
              <Button
                loading={isPublishing}
                onClick={async () => {
                  setMutationError(null);
                  setIsPublishing(true);
                  try {
                    await publish({ postId: post._id });
                  } catch (error) {
                    console.error("Failed to publish:", error);
                    setMutationError(error instanceof Error ? error.message : "Failed to publish");
                  } finally {
                    setIsPublishing(false);
                  }
                }}
                aria-label="Publish changelog"
              >
                {isPublishing ? "Publishing…" : "Publish"}
              </Button>
            )}
            <Button
              className="border border-[var(--border)] !bg-transparent text-[var(--fg)] hover:!bg-[var(--gray-100)]"
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
              {copyStatus === "copied" ? "Copied!" : copyStatus === "error" ? "Copy failed" : "Copy public link"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
