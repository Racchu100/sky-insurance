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
          label: "Expiring in 30 Days",
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

      {/* Premium this month */}
      {stats && (
        <div style={{
          background: "linear-gradient(135deg, #0c1a2e 0%, #0f2744 100%)",
          borderRadius: 16, padding: "20px 24px",
          marginBottom: 28,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44,
              background: "rgba(14,165,233,0.2)",
              borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <TrendingUp size={22} color="#0ea5e9" />
            </div>
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>
                Total Premium Collected This Month
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "white" }}>
                {formatCurrency(stats.premiumThisMonth)}
              </div>
            </div>
          </div>
          <Link href="/policies" className="btn" style={{
            background: "rgba(255,255,255,0.1)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.15)"
          }}>
            View All Policies <ArrowRight size={15} />
          </Link>
        </div>
      )}

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
            <span className="section-card-title">Policies Expiring in Next 30 Days</span>
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
