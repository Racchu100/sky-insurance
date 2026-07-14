"use client";

import { useState, useEffect } from "react";
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
  ChevronLeft,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage safely inside useEffect
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed") === "true";
    setIsCollapsed(saved);
    setMounted(true);
  }, []);

  // Update document body and localStorage
  useEffect(() => {
    if (!mounted) return;
    if (isCollapsed) {
      document.body.classList.add("sidebar-collapsed");
      localStorage.setItem("sidebar-collapsed", "true");
    } else {
      document.body.classList.remove("sidebar-collapsed");
      localStorage.setItem("sidebar-collapsed", "false");
    }
  }, [isCollapsed, mounted]);

  const isAdmin = session?.user?.role === "ADMIN";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        justifyContent: isCollapsed ? "center" : "flex-start",
        alignItems: "center"
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
          {!isCollapsed && (
            <div className="sidebar-logo-text" style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
                Sky Insurance
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                Policy Portal
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", alignItems: isCollapsed ? "center" : "stretch" }}>
        {!isCollapsed && (
          <div className="sidebar-group-title" style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", paddingLeft: 4, marginBottom: 8 }}>
            Main
          </div>
        )}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
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
                  style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
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
                  {!isCollapsed && <span className="sidebar-nav-label">{label}</span>}
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-nav-link ${active ? "active" : ""}`}
                style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
                title={isCollapsed ? label : undefined}
              >
                <Icon size={17} />
                {!isCollapsed && <span className="sidebar-nav-label">{label}</span>}
                {active && !isCollapsed && <ChevronRight size={14} className="sidebar-chevron" style={{ marginLeft: "auto" }} />}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <>
            {!isCollapsed && (
              <div className="sidebar-group-title" style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", paddingLeft: 4, marginBottom: 8, marginTop: 20 }}>
                Admin
              </div>
            )}
            <nav style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
              {adminNavItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`sidebar-nav-link ${active ? "active" : ""}`}
                    style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
                    title={isCollapsed ? label : undefined}
                  >
                    <Icon size={17} />
                    {!isCollapsed && <span className="sidebar-nav-label">{label}</span>}
                    {active && !isCollapsed && <ChevronRight size={14} className="sidebar-chevron" style={{ marginLeft: "auto" }} />}
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
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: isCollapsed ? "center" : "stretch"
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 10,
          marginBottom: 8,
          justifyContent: isCollapsed ? "center" : "flex-start",
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
          {!isCollapsed && (
            <div className="sidebar-user-info" style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {session?.user?.name}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                {session?.user?.role}
              </div>
            </div>
          )}
        </div>

        <button
          className="sidebar-nav-link"
          onClick={() => handleSignOut()}
          id="logout-btn"
          style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut size={17} />
          {!isCollapsed && <span className="sidebar-nav-label">Sign Out</span>}
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

      {/* Desktop collapse/expand toggle button */}
      {mounted && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex"
          id="desktop-sidebar-toggle"
          style={{
            position: "fixed",
            top: 24,
            left: isCollapsed ? 60 : 228,
            zIndex: 201,
            width: 24,
            height: 24,
            background: "#0284c7",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease",
          }}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      {/* Desktop sidebar */}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`} style={{ display: "flex", flexDirection: "column" }}>
        <SidebarContent />
      </aside>
    </>
  );
}
