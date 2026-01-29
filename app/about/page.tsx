import Link from "next/link";

export default function About() {
  return (
    <main className="flex h-[100dvh] items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="w-full max-w-[520px] text-center">
        <header className="mb-5 sm:mb-8">
          <Link href="/" className="text-[1.375rem] font-semibold tracking-[-0.02em] transition-opacity duration-150 hover:opacity-70 sm:text-[1.625rem]">&lt;uncommit/&gt;</Link>
        </header>

        <div className="flex flex-col gap-3 text-left sm:gap-4">
          <section className="flex flex-col gap-1">
            <h2 className="text-[0.625rem] font-medium uppercase tracking-[0.05em] opacity-50 sm:text-[0.6875rem]">What is this?</h2>
            <p className="text-[0.75rem] leading-relaxed opacity-80 sm:text-[0.8125rem]">
              AI-powered changelogs from your code. Install our GitHub App, and we detect version bumps and generate release notes from your diffs.
            </p>
          </section>

          <section className="flex flex-col gap-1">
            <h2 className="text-[0.625rem] font-medium uppercase tracking-[0.05em] opacity-50 sm:text-[0.6875rem]">How it works</h2>
            <ol className="list-inside list-decimal text-[0.75rem] leading-[1.6] opacity-80 sm:text-[0.8125rem] sm:leading-[1.7]">
              <li>Connect your repo and install the app</li>
              <li>Bump version and push to main</li>
              <li>We generate a diff and create release notes</li>
              <li>Review as draft or auto-publish</li>
            </ol>
          </section>

          <section className="flex flex-col gap-1">
            <h2 className="text-[0.625rem] font-medium uppercase tracking-[0.05em] opacity-50 sm:text-[0.6875rem]">Options</h2>
            <ul className="list-inside list-disc text-[0.75rem] leading-[1.6] opacity-80 sm:text-[0.8125rem] sm:leading-[1.7]">
              <li><strong>Trigger</strong> — every release or major only</li>
              <li><strong>Mode</strong> — auto-publish or draft first</li>
              <li><strong>Source</strong> — auto-detect or uncommit.json</li>
            </ul>
          </section>

          <section className="flex flex-col gap-1">
            <h2 className="text-[0.625rem] font-medium uppercase tracking-[0.05em] opacity-50 sm:text-[0.6875rem]">Supported files</h2>
            <p className="flex flex-wrap gap-1 text-[0.75rem] opacity-80 sm:gap-1.5 sm:text-[0.8125rem]">
              <code className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-100)] px-1.5 py-0.5 text-[0.5625rem] sm:text-[0.625rem]">package.json</code>
              <code className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-100)] px-1.5 py-0.5 text-[0.5625rem] sm:text-[0.625rem]">Cargo.toml</code>
              <code className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-100)] px-1.5 py-0.5 text-[0.5625rem] sm:text-[0.625rem]">pyproject.toml</code>
              <code className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-100)] px-1.5 py-0.5 text-[0.5625rem] sm:text-[0.625rem]">version.txt</code>
              <code className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gray-100)] px-1.5 py-0.5 text-[0.5625rem] sm:text-[0.625rem]">uncommit.json</code>
            </p>
          </section>

          <section className="flex flex-col gap-1">
            <h2 className="text-[0.625rem] font-medium uppercase tracking-[0.05em] opacity-50 sm:text-[0.6875rem]">Pricing</h2>
            <div className="text-[0.75rem] leading-[1.6] opacity-80 sm:text-[0.8125rem] sm:leading-[1.7]">
              <span><strong>Free</strong> — yourrepo.uncommit.sh</span>
              <span className="mx-2 opacity-30">·</span>
              <span><strong>$15/mo</strong> — custom domain</span>
            </div>
          </section>

          <div className="flex items-center justify-between pt-2 sm:pt-3">
            <Link href="/" className="py-1 text-[0.6875rem] opacity-50 transition-opacity duration-150 hover:opacity-100 sm:text-[0.75rem]">&larr; Back</Link>
            <a 
              href="https://github.com/plyght/uncommit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="py-1 text-[0.6875rem] opacity-50 transition-opacity duration-150 hover:opacity-100 sm:text-[0.75rem]"
            >
              Source &rarr;
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
