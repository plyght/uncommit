"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/Button";

export default function Home() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.logo}>uncommit</h1>
        <p style={styles.tagline}>AI-generated release notes from your code</p>
        
        <Unauthenticated>
          <div style={styles.buttonContainer}>
            <Button onClick={() => signIn("github")}>Connect GitHub</Button>
          </div>
        </Unauthenticated>

        <Authenticated>
          <AuthenticatedRedirect />
        </Authenticated>

        <footer style={styles.footer}>
          <a 
            href="https://github.com/yourusername/uncommit" 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.link}
          >
            GitHub
          </a>
        </footer>
      </div>
    </main>
  );
}

function AuthenticatedRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return <p>Redirecting to dashboard...</p>;
}

const styles = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  container: {
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center' as const,
  },
  logo: {
    fontSize: '3rem',
    fontWeight: 700,
    marginBottom: '1rem',
    letterSpacing: '-0.02em',
  },
  tagline: {
    fontSize: '1.125rem',
    marginBottom: '3rem',
    opacity: 0.7,
  },
  buttonContainer: {
    marginBottom: '4rem',
  },
  footer: {
    paddingTop: '2rem',
    borderTop: `1px solid var(--border)`,
  },
  link: {
    opacity: 0.6,
    transition: 'opacity 0.2s',
  },
};
