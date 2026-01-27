"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { skip, useMutation, useQuery } from "convex/react";
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
    currentUser && postId ? { postId: postId as Id<"changelogs"> } : skip
  );
  const updateChangelog = useMutation(api.changelogs.updateChangelog);
  const publish = useMutation(api.changelogs.publishChangelog);
  const unpublish = useMutation(api.changelogs.unpublishChangelog);

  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    if (data?.changelog) {
      setTitle(data.changelog.title);
      setMarkdown(data.changelog.markdown);
    }
  }, [data]);

  if (!postId) {
    return (
      <main className="page">
        <div className="container">
          <p className="field-hint">Changelog not found.</p>
        </div>
      </main>
    );
  }

  if (currentUser === undefined || data === undefined) {
    return (
      <main className="page">
        <div className="container">
          <p className="loading">Loading...</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="page">
        <div className="container">
          <p className="field-hint">Sign in to edit changelogs.</p>
          <Link href="/" className="field-link">
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page">
        <div className="container">
          <p className="field-hint">Changelog not found.</p>
        </div>
      </main>
    );
  }

  const post = data.changelog;

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <Link href="/dashboard" className="back-link">
            ← Back
          </Link>
          <h1 className="logo">Edit changelog</h1>
          <p className="tagline">{data.repo.repoOwner}/{data.repo.repoName}</p>
        </header>

        <div className="form">
          <div className="field">
            <label className="label">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="field">
            <label className="label">Markdown</label>
            <MarkdownEditor value={markdown} onChange={setMarkdown} />
          </div>

          <div className="dashboard-actions">
            <Button onClick={() => void updateChangelog({ postId: post._id, title, markdown })}>Save</Button>
            {post.status === "published" ? (
              <Button onClick={() => void unpublish({ postId: post._id })}>Unpublish</Button>
            ) : (
              <Button onClick={() => void publish({ postId: post._id })}>Publish</Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
