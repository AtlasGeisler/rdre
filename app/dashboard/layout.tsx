"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", exact: true },
  { href: "/dashboard/schedule", label: "Schedule", icon: "📸" },
  { href: "/dashboard/gps", label: "GP Network", icon: "🏥" },
  { href: "/dashboard/pulse", label: "Pulse Center", icon: "🎬" },
  { href: "/dashboard/referrals", label: "Referral Log", icon: "📋" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Fetch user name from a lightweight call or just read from cookie
    // We'll use /api/health as a proxy check; user name is available from session
    // Actually we'll get it from the dashboard API
    fetch("/api/health").then(r => r.json()).then(() => {
      // Try to get username from local storage fallback
      setUserName("Dr. Geisler");
    });
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function isActive(link: typeof NAV_LINKS[0]) {
    if (link.exact) return pathname === link.href;
    return pathname.startsWith(link.href);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#1A1A1A" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 99, display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar${sidebarOpen ? " sidebar-open" : ""}`}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 240,
          height: "100vh",
          background: "#1E3A28",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #2A4A38",
          zIndex: 100,
          transition: "transform 0.25s ease",
        }}
      >
        {/* Logo */}
        <div style={{
          padding: "24px 20px",
          borderBottom: "1px solid #2A4A38",
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#F5F0E8", letterSpacing: "-0.5px" }}>RDRE</div>
          <div style={{ fontSize: 11, color: "#C9A84C", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2, fontWeight: 600 }}>
            United Endodontics
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV_LINKS.map(link => {
            const active = isActive(link);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 20px",
                  color: active ? "#7CB68A" : "#A8A08C",
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  textDecoration: "none",
                  background: active ? "rgba(58,125,68,0.18)" : "transparent",
                  borderLeft: active ? "3px solid #3A7D44" : "3px solid transparent",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(58,125,68,0.1)";
                    (e.currentTarget as HTMLElement).style.color = "#F5F0E8";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#A8A08C";
                  }
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #2A4A38" }}>
          <div style={{ fontSize: 13, color: "#F5F0E8", fontWeight: 500, marginBottom: 10 }}>
            {userName || "Dr. Geisler"}
          </div>
          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              color: "#A8A08C",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
              fontFamily: "inherit",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#F5F0E8")}
            onMouseLeave={e => (e.currentTarget.style.color = "#A8A08C")}
          >
            <span>🚪</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        className="hamburger"
        onClick={() => setSidebarOpen(o => !o)}
        style={{
          display: "none",
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 200,
          background: "#1E3A28",
          border: "1px solid #2A4A38",
          borderRadius: 6,
          padding: "8px 10px",
          color: "#F5F0E8",
          fontSize: 18,
          cursor: "pointer",
        }}
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Main content */}
      <main
        className="main-content"
        style={{
          marginLeft: 240,
          flex: 1,
          padding: "32px 36px",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar-open {
            transform: translateX(0) !important;
          }
          .mobile-overlay {
            display: block !important;
          }
          .hamburger {
            display: block !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 60px 16px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
