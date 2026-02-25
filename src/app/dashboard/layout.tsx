import Link from "next/link";
import type { Metadata } from "next";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard | AtysPro",
  description: "Visualisez et gérez vos leads AtysPro",
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <Link href="/dashboard" className="dashboard-brand">
          AtysPro
        </Link>
        <nav className="dashboard-nav">
          <Link href="/dashboard" className="dashboard-nav-link">
            Leads
          </Link>
          <Link href="/" className="dashboard-nav-link dashboard-nav-link--muted">
            Accueil
          </Link>
        </nav>
      </header>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
