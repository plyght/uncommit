import Link from "next/link";

export default function About() {
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: "520px" }}>
        <header className="header">
          <Link href="/" className="logo">uncommit</Link>
        </header>

        <div className="about-content">
          <section className="about-section">
            <h2 className="about-heading">What is this?</h2>
            <p className="about-text">
              Uncommit generates AI-powered release notes from your code. 
              It installs a GitHub Actions workflow that triggers when you 
              bump your version and push to main.
            </p>
          </section>

          <section className="about-section">
            <h2 className="about-heading">How it works</h2>
            <ol className="about-list">
              <li>You bump your version (package.json, Cargo.toml, etc.)</li>
              <li>Push to main/master</li>
              <li>Workflow detects the version change</li>
              <li>Generates a diff since your last tag</li>
              <li>Sends diff to your AI provider</li>
              <li>Creates a GitHub release with the generated notes</li>
            </ol>
          </section>

          <section className="about-section">
            <h2 className="about-heading">Supported files</h2>
            <p className="about-text">
              <code className="field-code">package.json</code>{" "}
              <code className="field-code">Cargo.toml</code>{" "}
              <code className="field-code">pyproject.toml</code>{" "}
              <code className="field-code">version.txt</code>{" "}
              <code className="field-code">VERSION</code>
            </p>
          </section>

          <section className="about-section">
            <h2 className="about-heading">Security</h2>
            <p className="about-text">
              Your API key is encrypted using libsodium sealed_box with 
              GitHub&apos;s public key before being stored as a repository secret. 
              Only GitHub can decrypt it. The key is never stored on our servers.
            </p>
          </section>

          <section className="about-section">
            <h2 className="about-heading">Source</h2>
            <p className="about-text">
              <a 
                href="https://github.com/plyght/uncommit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="field-link"
              >
                github.com/plyght/uncommit
              </a>
            </p>
          </section>

          <Link href="/" className="back-link">&larr; Back</Link>
        </div>
      </div>
    </main>
  );
}
