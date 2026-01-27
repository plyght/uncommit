import Link from "next/link";

export default function About() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-[520px] text-center">
        <header className="mb-12">
          <Link href="/" className="text-[1.75rem] font-semibold tracking-[-0.02em] transition-opacity duration-150 hover:opacity-70">&lt;uncommit/&gt;</Link>
        </header>

        <div className="flex flex-col gap-6 text-left">
          <section className="flex flex-col gap-2">
            <h2 className="mb-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">What is this?</h2>
            <p className="text-[0.8125rem] leading-relaxed opacity-80">
              Uncommit generates AI-powered release notes from your code. 
              It installs a GitHub Actions workflow that triggers when you 
              bump your version and push to main.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="mb-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">How it works</h2>
            <ol className="ml-5 list-decimal text-[0.8125rem] leading-[1.8] opacity-80 [&>li]:mb-1">
              <li>You bump your version (package.json, Cargo.toml, etc.)</li>
              <li>Push to main/master</li>
              <li>Workflow detects the version change</li>
              <li>Generates a diff since your last tag</li>
              <li>Sends diff to your AI provider</li>
              <li>Creates a GitHub release with the generated notes</li>
            </ol>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="mb-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Supported files</h2>
            <p className="text-[0.8125rem] leading-relaxed opacity-80">
              <code className="border border-[var(--border)] bg-[var(--gray-100)] px-1 py-0.5 text-[0.625rem]">
                package.json
              </code>{" "}
              <code className="border border-[var(--border)] bg-[var(--gray-100)] px-1 py-0.5 text-[0.625rem]">
                Cargo.toml
              </code>{" "}
              <code className="border border-[var(--border)] bg-[var(--gray-100)] px-1 py-0.5 text-[0.625rem]">
                pyproject.toml
              </code>{" "}
              <code className="border border-[var(--border)] bg-[var(--gray-100)] px-1 py-0.5 text-[0.625rem]">
                version.txt
              </code>{" "}
              <code className="border border-[var(--border)] bg-[var(--gray-100)] px-1 py-0.5 text-[0.625rem]">
                VERSION
              </code>
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="mb-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Security</h2>
            <p className="text-[0.8125rem] leading-relaxed opacity-80">
              Your API key is encrypted using libsodium sealed_box with 
              GitHub&apos;s public key before being stored as a repository secret. 
              Only GitHub can decrypt it. The key is never stored on our servers.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="mb-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.05em] opacity-50">Source</h2>
            <p className="text-[0.8125rem] leading-relaxed opacity-80">
              <a 
                href="https://github.com/plyght/uncommit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline underline-offset-2 opacity-80 transition-opacity duration-150 hover:opacity-100 hover:text-[var(--accent)]"
              >
                github.com/plyght/uncommit
              </a>
            </p>
          </section>

          <Link href="/" className="inline-block text-[0.75rem] opacity-50 transition-opacity duration-150 hover:opacity-100">&larr; Back</Link>
        </div>
      </div>
    </main>
  );
}
