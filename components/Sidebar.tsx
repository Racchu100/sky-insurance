"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { handleSignOut } from "@/lib/actions";
import {
  LayoutDashboard,
  FileText,
  Plus,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronRight,
  User,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/policies", label: "All Policies", icon: FileText },
  { href: "/policies/new", label: "Add Policy", icon: Plus },
];

const adminNavItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38,
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(14,165,233,0.4)",
            flexShrink: 0
          }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
              Sky Insurance
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
              Policy Portal
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", paddingLeft: 4, marginBottom: 8 }}>
          Main
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href) && href !== "/policies/new");
            const isNew = href === "/policies/new";
            if (isNew) {
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="sidebar-nav-link"
                  style={active ? {} : {}}
                >
                  <div style={{
                    width: 28, height: 28,
                    background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                    borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Icon size={15} color="white" />
                  </div>
                  {label}
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-nav-link ${active ? "active" : ""}`}
              >
                <Icon size={17} />
                {label}
                {active && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", paddingLeft: 4, marginBottom: 8, marginTop: 20 }}>
              Admin
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {adminNavItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`sidebar-nav-link ${active ? "active" : ""}`}
                  >
                    <Icon size={17} />
                    {label}
                    {active && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </div>

      {/* User profile + logout */}
      <div style={{
        padding: "16px 12px",
        borderTop: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 10,
          marginBottom: 8
        }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0
          }}>
            <User size={16} color="white" />
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {session?.user?.name}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
              {session?.user?.role}
            </div>
          </div>
        </div>

        <button
          className="sidebar-nav-link"
          onClick={() => handleSignOut()}
          id="logout-btn"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div
        className="mobile-header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 16px",
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}
      >
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          id="mobile-menu-toggle"
          style={{
            width: 38,
            height: 38,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#1e293b",
          }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/dashboard" style={{ marginLeft: 12, fontWeight: 700, fontSize: 16, color: "#0f172a", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <Shield size={18} color="#0284c7" />
          <span>Sky Insurance</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 49, backdropFilter: "blur(4px)"
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`} style={{ display: "flex", flexDirection: "column" }}>
        <SidebarContent />
      </aside>
    </>
  );
}
