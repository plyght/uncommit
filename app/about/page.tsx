import Link from "next/link";

export default function About() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-[520px] text-left">
        <header className="mb-10">
          <Link href="/" className="text-[1.5rem] font-semibold tracking-[-0.02em]">&lt;uncommit/&gt;</Link>
        </header>

        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-2">
            <h2 className="text-[1rem] font-semibold">What is this?</h2>
            <p className="text-[0.85rem] opacity-70">
              Uncommit generates AI-powered release notes from your code. 
              It installs a GitHub Actions workflow that triggers when you 
              bump your version and push to main.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[1rem] font-semibold">How it works</h2>
            <ol className="ml-5 list-decimal text-[0.85rem] opacity-70">
              <li>You bump your version (package.json, Cargo.toml, etc.)</li>
              <li>Push to main/master</li>
              <li>Workflow detects the version change</li>
              <li>Generates a diff since your last tag</li>
              <li>Sends diff to your AI provider</li>
              <li>Creates a GitHub release with the generated notes</li>
            </ol>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[1rem] font-semibold">Supported files</h2>
            <p className="text-[0.85rem] opacity-70">
              <code className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-100)] px-1 py-0.5 font-mono text-[0.75rem]">
                package.json
              </code>{" "}
              <code className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-100)] px-1 py-0.5 font-mono text-[0.75rem]">
                Cargo.toml
              </code>{" "}
              <code className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-100)] px-1 py-0.5 font-mono text-[0.75rem]">
                pyproject.toml
              </code>{" "}
              <code className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-100)] px-1 py-0.5 font-mono text-[0.75rem]">
                version.txt
              </code>{" "}
              <code className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-100)] px-1 py-0.5 font-mono text-[0.75rem]">
                VERSION
              </code>
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[1rem] font-semibold">Security</h2>
            <p className="text-[0.85rem] opacity-70">
              Your API key is encrypted using libsodium sealed_box with 
              GitHub&apos;s public key before being stored as a repository secret. 
              Only GitHub can decrypt it. The key is never stored on our servers.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[1rem] font-semibold">Source</h2>
            <p className="text-[0.85rem] opacity-70">
              <a 
                href="https://github.com/plyght/uncommit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                github.com/plyght/uncommit
              </a>
            </p>
          </section>

          <Link href="/" className="text-[0.75rem] opacity-60 hover:opacity-100">&larr; Back</Link>
        </div>
      </div>
    </main>
  );
}
