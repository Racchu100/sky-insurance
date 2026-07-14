"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Calendar,
  ArrowRight,
  Phone,
  Car,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardStats {
  totalActive: number;
  expiringThisMonth: number;
  expiredCount: number;
  newThisMonth: number;
  premiumThisMonth: number;
  expiringSoonDays?: number;
  premiumCollected?: {
    yearly: {
      currentValue: number;
      prevValue: number;
      percentage: { value: string; type: "up" | "down" | "flat" };
      labels: { current: string; prev: string };
    };
    monthly: {
      currentValue: number;
      prevValue: number;
      percentage: { value: string; type: "up" | "down" | "flat" };
      labels: { current: string; prev: string };
    };
  };
  expiringPolicies: Array<{
    id: string;
    customerName: string;
    vehicleNo: string;
    vehicleModel: string;
    insuranceComp: string;
    riskEndDate: string;
    premium: number;
    mobileNo: string;
  }>;
}

function PremiumTrendCard({
  title,
  subtitle,
  currentValue,
  prevValue,
  percentage,
  labels,
  colorScheme,
}: {
  title: string;
  subtitle: string;
  currentValue: number;
  prevValue: number;
  percentage: { value: string; type: "up" | "down" | "flat" };
  labels: { current: string; prev: string };
  colorScheme: "red" | "green";
}) {
  const maxVal = Math.max(currentValue, prevValue);
  const chartHeight = 80;

  const prevHeight = maxVal > 0 ? (prevValue / maxVal) * chartHeight : 4;
  const currentHeight = maxVal > 0 ? (currentValue / maxVal) * chartHeight : 4;

  const prevColor = colorScheme === "red" ? "#fca5a5" : "#86efac";
  const currentColor = colorScheme === "red" ? "#dc2626" : "#16a34a";
  const pctColor = percentage.type === "up" ? "#16a34a" : percentage.type === "down" ? "#dc2626" : "#64748b";
  const pctBg = percentage.type === "up" ? "#dcfce7" : percentage.type === "down" ? "#fee2e2" : "#f1f5f9";

  return (
    <div className="section-card" style={{
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      minHeight: 260,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: pctBg,
          color: pctColor,
          padding: "4px 8px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
        }}>
          <span>{percentage.value}%</span>
          <span>{percentage.type === "up" ? "↑" : percentage.type === "down" ? "↓" : "→"}</span>
        </div>
      </div>

      <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
        {formatCurrency(currentValue)}
      </div>

      <div style={{
        position: "relative",
        height: chartHeight + 20,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 24,
        paddingBottom: 10,
        borderBottom: "1px solid #f1f5f9",
      }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none", zIndex: 0 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: "100%", height: 1, borderTop: "1px dashed #f1f5f9" }} />
          ))}
        </div>

        <div style={{
          position: "relative",
          width: 32,
          height: prevHeight,
          background: prevColor,
          borderRadius: "6px 6px 0 0",
          zIndex: 1,
          transition: "height 0.5s ease-out",
        }} title={`${labels.prev}: ${formatCurrency(prevValue)}`} />

        <div style={{
          position: "relative",
          width: 32,
          height: currentHeight,
          background: currentColor,
          borderRadius: "6px 6px 0 0",
          zIndex: 1,
          transition: "height 0.5s ease-out",
        }} title={`${labels.current}: ${formatCurrency(currentValue)}`} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "#64748b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, background: prevColor, borderRadius: 3 }} />
          <span>{labels.prev}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, background: currentColor, borderRadius: 3 }} />
          <span>{labels.current}</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        {
          label: "Active Policies",
          value: stats.totalActive,
          icon: FileText,
          color: "#0284c7",
          bg: "#e0f2fe",
          href: "/policies?status=ACTIVE",
        },
        {
          label: `Expiring in ${stats.expiringSoonDays ?? 30} Days`,
          value: stats.expiringThisMonth,
          icon: AlertTriangle,
          color: "#d97706",
          bg: "#fef3c7",
          href: "/policies?status=EXPIRING_SOON",
        },
        {
          label: "Expired Policies",
          value: stats.expiredCount,
          icon: XCircle,
          color: "#dc2626",
          bg: "#fee2e2",
          href: "/policies?status=EXPIRED",
        },
        {
          label: "New This Month",
          value: stats.newThisMonth,
          icon: TrendingUp,
          color: "#16a34a",
          bg: "#dcfce7",
          href: "/policies",
        },
      ]
    : [];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Link href="/policies/new" className="btn btn-primary" id="dashboard-add-policy">
          <Plus size={16} />
          Add New Policy
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="stat-card" style={{ height: 110 }}>
                <div className="skeleton" style={{ height: 20, width: "60%", marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 36, width: "40%" }} />
              </div>
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="stat-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(card.href)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>
                      {card.label}
                    </div>
                    <div style={{
                      width: 36, height: 36,
                      background: card.bg,
                      borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <Icon size={18} color={card.color} />
                    </div>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: card.color, lineHeight: 1 }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                    Click to view →
                  </div>
                </div>
              );
            })}
      </div>

      {/* Premium Collected Trend Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 16,
        marginBottom: 28,
      }}>
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="section-card" style={{ height: 260, padding: 20 }}>
              <div className="skeleton" style={{ height: 20, width: "50%", marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 36, width: "30%", marginBottom: 24 }} />
              <div className="skeleton" style={{ height: 80, width: "100%", marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 16, width: "60%" }} />
            </div>
          ))
        ) : (
          stats?.premiumCollected && (
            <>
              <PremiumTrendCard
                title="Premium Collected"
                subtitle="Yearly trend"
                currentValue={stats.premiumCollected.yearly.currentValue}
                prevValue={stats.premiumCollected.yearly.prevValue}
                percentage={stats.premiumCollected.yearly.percentage}
                labels={stats.premiumCollected.yearly.labels}
                colorScheme="red"
              />
              <PremiumTrendCard
                title="Premium Collected"
                subtitle="Monthly Trend"
                currentValue={stats.premiumCollected.monthly.currentValue}
                prevValue={stats.premiumCollected.monthly.prevValue}
                percentage={stats.premiumCollected.monthly.percentage}
                labels={stats.premiumCollected.monthly.labels}
                colorScheme="green"
              />
            </>
          )
        )}
      </div>

      {/* Expiring policies widget */}
      <div className="section-card">
        <div className="section-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "#fef3c7",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Calendar size={15} color="#d97706" />
            </div>
            <span className="section-card-title">Policies Expiring in Next {stats?.expiringSoonDays ?? 30} Days</span>
            {stats && (
              <span className="badge badge-expiring" style={{ marginLeft: 4 }}>
                {stats.expiringThisMonth} policies
              </span>
            )}
          </div>
          <Link
            href="/policies?status=EXPIRING_SOON"
            style={{ fontSize: 13, color: "#0284c7", textDecoration: "none", fontWeight: 500 }}
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>
            {Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div className="skeleton" style={{ height: 14, flex: 1 }} />
                <div className="skeleton" style={{ height: 14, width: 80 }} />
                <div className="skeleton" style={{ height: 14, width: 100 }} />
              </div>
            ))}
          </div>
        ) : stats?.expiringPolicies.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            <Calendar size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ fontSize: 14 }}>No policies expiring in the next 30 days 🎉</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle No</th>
                  <th>Model</th>
                  <th>Insurer</th>
                  <th>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Phone size={12} /> Contact
                    </div>
                  </th>
                  <th>Risk End Date</th>
                  <th>Premium</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stats?.expiringPolicies.map((policy) => (
                  <tr key={policy.id} onClick={() => router.push(`/policies/${policy.id}`)}>
                    <td style={{ fontWeight: 500 }}>{policy.customerName}</td>
                    <td>
                      <span style={{
                        fontFamily: "monospace", fontSize: 12,
                        background: "#f1f5f9", padding: "2px 6px",
                        borderRadius: 4
                      }}>
                        {policy.vehicleNo}
                      </span>
                    </td>
                    <td style={{ color: "#64748b" }}>{policy.vehicleModel}</td>
                    <td style={{ color: "#64748b" }}>{policy.insuranceComp}</td>
                    <td>
                      <a
                        href={`tel:${policy.mobileNo}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "#0284c7", textDecoration: "none", fontSize: 13 }}
                      >
                        {policy.mobileNo}
                      </a>
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatDate(policy.riskEndDate)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(policy.premium)}</td>
                    <td>
                      <StatusBadge riskEndDate={policy.riskEndDate} showDays />
                    </td>
                    <td>
                      <ArrowRight size={14} color="#94a3b8" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
