"use client";

import { getPolicyStatus, type PolicyStatus } from "@/lib/utils";

interface StatusBadgeProps {
  riskEndDate: Date | string;
  showDays?: boolean;
}

const statusConfig: Record<PolicyStatus, { label: string; className: string; dot: string }> = {
  ACTIVE: {
    label: "Active",
    className: "badge-active",
    dot: "#16a34a",
  },
  EXPIRING_SOON: {
    label: "Expiring Soon",
    className: "badge-expiring",
    dot: "#d97706",
  },
  EXPIRED: {
    label: "Expired",
    className: "badge-expired",
    dot: "#dc2626",
  },
};

export default function StatusBadge({ riskEndDate, showDays = false }: StatusBadgeProps) {
  const status = getPolicyStatus(riskEndDate);
  const config = statusConfig[status];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(riskEndDate);
  const daysRemaining = Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <span className={`badge ${config.className}`}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: config.dot,
        display: "inline-block",
        flexShrink: 0
      }} />
      {config.label}
      {showDays && status !== "ACTIVE" && (
        <span style={{ opacity: 0.8, fontSize: 11 }}>
          {status === "EXPIRED"
            ? ` (${Math.abs(daysRemaining)}d ago)`
            : ` (${daysRemaining}d)`}
        </span>
      )}
    </span>
  );
}
