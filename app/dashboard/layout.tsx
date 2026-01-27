import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">&lt;uncommit/&gt;</div>
        <nav className="dashboard-nav">
          <Link href="/dashboard" className="dashboard-link">
            Overview
          </Link>
          <Link href="/onboarding" className="dashboard-link">
            Onboarding
          </Link>
        </nav>
      </aside>
      <section className="dashboard-main">{children}</section>
    </div>
  );
}
