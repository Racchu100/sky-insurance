"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import PolicyForm from "@/components/PolicyForm";
import type { PolicyFormData } from "@/lib/validators";

export default function NewPolicyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (data: PolicyFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const policy = await res.json();
        showToast("Policy created successfully!", "success");
        setTimeout(() => router.push(`/policies/${policy.id}`), 800);
      } else {
        let errMsg = "Failed to create policy";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {}
        showToast(errMsg, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Link
              href="/policies"
              style={{ color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}
            >
              <ArrowLeft size={14} /> All Policies
            </Link>
          </div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <FileText size={18} color="white" />
            </div>
            Add New Policy
          </h1>
          <p className="page-subtitle">Fill in all required fields to create a new policy record</p>
        </div>
      </div>

      <PolicyForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        mode="create"
      />

      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}
    </div>
  );
}
