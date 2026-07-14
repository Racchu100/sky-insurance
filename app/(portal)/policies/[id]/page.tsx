"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit2,
  Eye,
  Trash2,
  Calendar,
  User,
  Car,
  Phone,
  FileText,
  IndianRupee,
  Clock,
  Shield,
} from "lucide-react";
import PolicyForm from "@/components/PolicyForm";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PolicyFormData } from "@/lib/validators";
import { useSession } from "next-auth/react";

interface Policy {
  id: string;
  date: string;
  customerName: string;
  customerNo?: string;
  mobileNo: string;
  refAgent: string;
  vehicleNo: string;
  vehicleModel: string;
  vehicleType: "PVT" | "COM";
  insuranceComp: string;
  riskStartDate: string;
  riskEndDate: string;
  policyNo: string;
  netPremium: number;
  gst: number;
  premium: number;
  investment: number;
  od: number;
  createdBy?: { name: string; email: string };
  updatedBy?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
  expiringSoonDays?: number;
  aadhaarCard?: string;
  panCard?: string;
  drivingLicense?: string;
}

function DocumentCard({ title, dataUrl }: { title: string; dataUrl: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <div style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        overflow: "hidden",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{title}</span>
          <button 
            type="button" 
            onClick={() => setModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ padding: "4px 8px", fontSize: 11 }}
          >
            View Full
          </button>
        </div>
        <div style={{ 
          height: 180, 
          position: "relative", 
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }} onClick={() => setModalOpen(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={dataUrl} 
            alt={title} 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 800, padding: 16 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Close</button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", background: "#f8fafc", borderRadius: 8, padding: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={dataUrl} 
                alt={title} 
                style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 6 }} 
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "true");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`/api/policies/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPolicy(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  const handleUpdate = async (data: PolicyFormData) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updated = await res.json();
        setPolicy(updated);
        setIsEditing(false);
        showToast("Policy updated successfully!", "success");
      } else {
        let errMsg = "Failed to update policy";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {}
        showToast(errMsg, "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/policies/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/policies");
    } else {
      showToast("Failed to delete policy", "error");
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in-up">
        <div className="skeleton" style={{ height: 28, width: 200, marginBottom: 24 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p style={{ fontSize: 18, color: "#64748b" }}>Policy not found</p>
        <Link href="/policies" className="btn btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
          Back to Policies
        </Link>
      </div>
    );
  }

  const infoRows = [
    { icon: <User size={15} color="#0284c7" />, label: "Customer", value: policy.customerName },
    { icon: <User size={15} color="#0284c7" />, label: "Customer No", value: policy.customerNo || "—" },
    { icon: <Phone size={15} color="#0284c7" />, label: "Mobile", value: <a href={`tel:${policy.mobileNo}`} style={{ color: "#0284c7", textDecoration: "none" }}>{policy.mobileNo}</a> },
    { icon: <User size={15} color="#7c3aed" />, label: "Ref Agent", value: policy.refAgent || "—" },
    { icon: <Car size={15} color="#7c3aed" />, label: "Vehicle No", value: <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{policy.vehicleNo}</span> },
    { icon: <Car size={15} color="#7c3aed" />, label: "Model", value: policy.vehicleModel },
    { icon: <Car size={15} color="#7c3aed" />, label: "Type", value: policy.vehicleType === "PVT" ? "Private" : "Commercial" },
    { icon: <FileText size={15} color="#16a34a" />, label: "Policy No", value: <span style={{ fontFamily: "monospace" }}>{policy.policyNo}</span> },
    { icon: <FileText size={15} color="#16a34a" />, label: "Insurance Co", value: policy.insuranceComp },
    { icon: <Calendar size={15} color="#16a34a" />, label: "Risk Start", value: formatDate(policy.riskStartDate) },
    { icon: <Calendar size={15} color="#d97706" />, label: "Risk End", value: formatDate(policy.riskEndDate) },
    { icon: <IndianRupee size={15} color="#d97706" />, label: "OD", value: formatCurrency(policy.od) },
    { icon: <IndianRupee size={15} color="#d97706" />, label: "Net Premium", value: formatCurrency(policy.netPremium) },
    { icon: <IndianRupee size={15} color="#d97706" />, label: "GST", value: formatCurrency(policy.gst) },
    { icon: <IndianRupee size={15} color="#d97706" />, label: "Premium", value: <span style={{ fontWeight: 800, fontSize: 16, color: "#0284c7" }}>{formatCurrency(policy.premium)}</span> },
    { icon: <IndianRupee size={15} color="#16a34a" />, label: "Investment", value: formatCurrency(policy.investment) },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Link href="/policies" style={{ color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> All Policies
            </Link>
          </div>
          <h1 className="page-title">{policy.customerName}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <span style={{ fontFamily: "monospace", fontSize: 13, background: "#f1f5f9", padding: "2px 8px", borderRadius: 5 }}>
              {policy.vehicleNo}
            </span>
            <StatusBadge riskEndDate={policy.riskEndDate} showDays threshold={policy.expiringSoonDays} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {!isEditing && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
                id="btn-edit-policy"
              >
                <Edit2 size={14} />
                Edit Policy
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setDeleteModal(true)}
                id="btn-delete-policy"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
          {isEditing && (
            <button
              className="btn btn-secondary"
              onClick={() => setIsEditing(false)}
              id="btn-cancel-edit"
            >
              <Eye size={14} />
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <PolicyForm
          defaultValues={{
            ...policy,
            date: policy.date,
            riskStartDate: policy.riskStartDate,
            riskEndDate: policy.riskEndDate,
          }}
          onSubmit={handleUpdate}
          isLoading={isSaving}
          mode="edit"
        />
      ) : (
        <>
          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginBottom: 20 }}>
            {infoRows.map((row) => (
              <div key={row.label} style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "14px 16px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  {row.icon}
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {row.label}
                  </span>
                </div>
                <div style={{ fontSize: 15, color: "#0f172a", fontWeight: 500 }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>

          {/* Customer Private Documents */}
          {(policy.aadhaarCard || policy.panCard || policy.drivingLicense) && (
            <div className="section-card" style={{ marginBottom: 20 }}>
              <div className="section-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={17} color="#dc2626" />
                  <span className="section-card-title">Customer Private Documents</span>
                </div>
              </div>
              <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {policy.aadhaarCard && (
                  <DocumentCard title="Aadhaar Card" dataUrl={policy.aadhaarCard} />
                )}
                {policy.panCard && (
                  <DocumentCard title="PAN Card" dataUrl={policy.panCard} />
                )}
                {policy.drivingLicense && (
                  <DocumentCard title="Driving License" dataUrl={policy.drivingLicense} />
                )}
              </div>
            </div>
          )}

          {/* Audit trail */}
          <div className="section-card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Clock size={15} color="#64748b" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Audit Trail</span>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "#475569" }}>
              <div>
                <span style={{ color: "#94a3b8" }}>Created:</span>{" "}
                <strong>{formatDate(policy.createdAt)}</strong>
                {policy.createdBy && <span> by {policy.createdBy.name}</span>}
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Last Updated:</span>{" "}
                <strong>{formatDate(policy.updatedAt)}</strong>
                {policy.updatedBy && <span> by {policy.updatedBy.name}</span>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, background: "#fee2e2", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={20} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>Delete Policy</h3>
                <p style={{ fontSize: 13, color: "#64748b" }}>This will soft-delete the record</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "#475569", marginBottom: 24 }}>
              Are you sure you want to delete the policy for <strong>{policy.customerName}</strong> ({policy.vehicleNo})?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setDeleteModal(false)} id="modal-cancel-detail">Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} id="modal-delete-detail">Delete Policy</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}
    </div>
  );
}
