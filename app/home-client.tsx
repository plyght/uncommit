"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/Button";
import { RepoSetupForm } from "@/components/RepoSetupForm";

export default function HomeClient() {
  return (
    <main className="flex min-h-screen items-center justify-center px-8 py-12">
      <div className="w-full max-w-[420px] text-center">
        <header className="mb-12">
          <h1 className="mb-2 text-[1.75rem] font-semibold tracking-[-0.02em]">&lt;uncommit/&gt;</h1>
          <p className="text-[0.75rem] opacity-60">AI-generated changelogs from your code</p>
        </header>

        <Unauthenticated>
          <LoginSection />
        </Unauthenticated>

        <Authenticated>
          <SetupSection />
        </Authenticated>
      </div>
    </main>
  );
}

function LoginSection() {
  const { signIn } = useAuthActions();

  const handleSignIn = async () => {
    try {
      const { redirect } = await signIn("github", { redirectTo: "/" });
      if (redirect) {
        window.location.href = redirect.toString();
      }
    } catch {
      // Ignore - connection lost during redirect is expected
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => void handleSignIn()} className="gap-2">
        <GitHubIcon />
        Sign in with GitHub
      </Button>
      <p className="text-[0.75rem] opacity-60">
        <Link href="/about" className="underline underline-offset-4">
          What is this?
        </Link>
      </p>
    </div>
  );
}

function SetupSection() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const [selectedRepo, setSelectedRepo] = useState("");

  if (currentUser === undefined) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-[0.75rem] opacity-60">Loading...</p>
      </div>
    );
  }

  return (
    <RepoSetupForm selectedRepo={selectedRepo} onSelectedRepoChange={setSelectedRepo} showAboutLink />
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "0.5rem" }}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
