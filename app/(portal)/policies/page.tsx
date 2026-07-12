"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Edit2,
  Trash2,
  Eye,
  X,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  createdBy?: { name: string };
}

interface PoliciesResponse {
  policies: Policy[];
  total: number;
  page: number;
  limit: number;
  expiringSoonDays?: number;
}

const COLUMNS = [
  { key: "customerName", label: "Customer", sortable: true },
  { key: "vehicleNo", label: "Vehicle No", sortable: true },
  { key: "vehicleModel", label: "Model", sortable: false },
  { key: "insuranceComp", label: "Insurer", sortable: true },
  { key: "vehicleType", label: "Type", sortable: false },
  { key: "policyNo", label: "Policy No", sortable: false },
  { key: "riskEndDate", label: "Risk End Date", sortable: true },
  { key: "premium", label: "Premium", sortable: true },
  { key: "status", label: "Status", sortable: false },
];

export default function PoliciesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [sortBy, setSortBy] = useState("riskEndDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [expiringSoonDays, setExpiringSoonDays] = useState<number>(30);

  // Filters
  const [filterInsurer, setFilterInsurer] = useState("");
  const [filterVehicleType, setFilterVehicleType] = useState("");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");
  const [filterAgent, setFilterAgent] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterRiskStartFrom, setFilterRiskStartFrom] = useState("");
  const [filterRiskStartTo, setFilterRiskStartTo] = useState("");
  const [filterRiskEndFrom, setFilterRiskEndFrom] = useState("");
  const [filterRiskEndTo, setFilterRiskEndTo] = useState("");
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterInsurer) params.set("insuranceComp", filterInsurer);
    if (filterVehicleType) params.set("vehicleType", filterVehicleType);
    if (filterStatus) params.set("status", filterStatus);
    if (filterAgent) params.set("refAgent", filterAgent);
    if (filterDateFrom) params.set("dateFrom", filterDateFrom);
    if (filterDateTo) params.set("dateTo", filterDateTo);
    if (filterRiskStartFrom) params.set("riskStartFrom", filterRiskStartFrom);
    if (filterRiskStartTo) params.set("riskStartTo", filterRiskStartTo);
    if (filterRiskEndFrom) params.set("riskEndFrom", filterRiskEndFrom);
    if (filterRiskEndTo) params.set("riskEndTo", filterRiskEndTo);
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    return params.toString();
  }, [search, filterInsurer, filterVehicleType, filterStatus, filterAgent, filterDateFrom, filterDateTo, filterRiskStartFrom, filterRiskStartTo, filterRiskEndFrom, filterRiskEndTo, page, limit, sortBy, sortOrder]);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/policies?${buildQueryParams()}`);
      const data: PoliciesResponse = await res.json();
      setPolicies(data.policies);
      setTotal(data.total);
      if (data.expiringSoonDays) {
        setExpiringSoonDays(data.expiringSoonDays);
      }
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPolicies, 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchPolicies]);

  useEffect(() => {
    fetch("/api/insurance-companies")
      .then((r) => r.json())
      .then(setCompanies);
  }, []);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleDelete = async (id: string, soft = true) => {
    const url = soft ? `/api/policies/${id}` : `/api/policies/${id}?hard=true`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      showToast("Policy deleted successfully", "success");
      setDeleteModal(null);
      fetchPolicies();
    } else {
      showToast("Failed to delete policy", "error");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterInsurer) params.set("insuranceComp", filterInsurer);
    if (filterVehicleType) params.set("vehicleType", filterVehicleType);
    if (filterStatus) params.set("status", filterStatus);
    if (filterAgent) params.set("refAgent", filterAgent);
    if (filterDateFrom) params.set("dateFrom", filterDateFrom);
    if (filterDateTo) params.set("dateTo", filterDateTo);
    if (filterRiskStartFrom) params.set("riskStartFrom", filterRiskStartFrom);
    if (filterRiskStartTo) params.set("riskStartTo", filterRiskStartTo);
    if (filterRiskEndFrom) params.set("riskEndFrom", filterRiskEndFrom);
    if (filterRiskEndTo) params.set("riskEndTo", filterRiskEndTo);

    const res = await fetch(`/api/policies/export?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `policies-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Export successful!", "success");
    } else {
      showToast("Export failed", "error");
    }
    setExporting(false);
  };

  const clearFilters = () => {
    setFilterInsurer("");
    setFilterVehicleType("");
    setFilterStatus("");
    setFilterAgent("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterRiskStartFrom("");
    setFilterRiskStartTo("");
    setFilterRiskEndFrom("");
    setFilterRiskEndTo("");
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = filterInsurer || filterVehicleType || filterStatus || filterAgent || filterDateFrom || filterDateTo || filterRiskStartFrom || filterRiskStartTo || filterRiskEndFrom || filterRiskEndTo || search;
  const totalPages = Math.ceil(total / limit);

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ChevronsUpDown size={13} style={{ opacity: 0.4 }} />;
    return sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">All Policies</h1>
          <p className="page-subtitle">{total} records found</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exporting} id="btn-export">
            <Download size={15} />
            {exporting ? "Exporting..." : "Export Excel"}
          </button>
          <Link href="/policies/new" className="btn btn-primary" id="btn-add-policy">
            <Plus size={15} />
            Add Policy
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="section-card" style={{ marginBottom: 20 }}>
        <div style={{ padding: "14px 16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div className="search-container" style={{ flex: 1, maxWidth: 460 }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by customer name, vehicle no, mobile, policy no..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              id="policy-search"
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            className={`btn btn-secondary btn-sm ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
            id="btn-toggle-filters"
            style={showFilters ? { borderColor: "#0284c7", color: "#0284c7" } : {}}
          >
            <Filter size={14} />
            Filters
            {hasActiveFilters && (
              <span style={{
                width: 18, height: 18, background: "#0284c7", borderRadius: "50%",
                color: "white", fontSize: 10, fontWeight: 700,
                display: "inline-flex", alignItems: "center", justifyContent: "center"
              }}>
                !
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button className="btn btn-danger btn-sm" onClick={clearFilters} id="btn-clear-filters">
              <X size={13} />
              Clear
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{
            padding: "14px 16px",
            borderTop: "1px solid #f1f5f9",
            background: "#f8fafc",
            display: "flex", gap: 12, flexWrap: "wrap"
          }}>
            <div className="form-field" style={{ minWidth: 180 }}>
              <label className="form-label">Insurance Company</label>
              <select className="form-input" style={{ fontSize: 13 }} value={filterInsurer} onChange={(e) => { setFilterInsurer(e.target.value); setPage(1); }} id="filter-insurer">
                <option value="">All Companies</option>
                {companies.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ minWidth: 150 }}>
              <label className="form-label">Vehicle Type</label>
              <select className="form-input" style={{ fontSize: 13 }} value={filterVehicleType} onChange={(e) => { setFilterVehicleType(e.target.value); setPage(1); }} id="filter-vehicle-type">
                <option value="">All Types</option>
                <option value="PVT">Private</option>
                <option value="COM">Commercial</option>
              </select>
            </div>
            <div className="form-field" style={{ minWidth: 150 }}>
              <label className="form-label">Status</label>
              <select className="form-input" style={{ fontSize: 13 }} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} id="filter-status">
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRING_SOON">Expiring Soon</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            <div className="form-field" style={{ minWidth: 150 }}>
              <label className="form-label">Ref Agent</label>
              <input type="text" className="form-input" style={{ fontSize: 13 }} placeholder="Agent name..." value={filterAgent} onChange={(e) => { setFilterAgent(e.target.value); setPage(1); }} id="filter-agent" />
            </div>

            {/* Date Filters Row */}
            <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 12, borderTop: "1px dashed #e2e8f0", paddingTop: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, color: "#475569" }}>Policy Date Range</label>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input type="date" className="form-input" style={{ fontSize: 12, padding: "6px 8px" }} value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} placeholder="From" id="filter-date-from" />
                  <span style={{ alignSelf: "center", color: "#94a3b8", fontSize: 12 }}>to</span>
                  <input type="date" className="form-input" style={{ fontSize: 12, padding: "6px 8px" }} value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} placeholder="To" id="filter-date-to" />
                </div>
              </div>
              
              <div>
                <label className="form-label" style={{ fontWeight: 600, color: "#475569" }}>Risk Start Date Range</label>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input type="date" className="form-input" style={{ fontSize: 12, padding: "6px 8px" }} value={filterRiskStartFrom} onChange={(e) => { setFilterRiskStartFrom(e.target.value); setPage(1); }} placeholder="From" id="filter-risk-start-from" />
                  <span style={{ alignSelf: "center", color: "#94a3b8", fontSize: 12 }}>to</span>
                  <input type="date" className="form-input" style={{ fontSize: 12, padding: "6px 8px" }} value={filterRiskStartTo} onChange={(e) => { setFilterRiskStartTo(e.target.value); setPage(1); }} placeholder="To" id="filter-risk-start-to" />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, color: "#475569" }}>Risk End Date Range</label>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input type="date" className="form-input" style={{ fontSize: 12, padding: "6px 8px" }} value={filterRiskEndFrom} onChange={(e) => { setFilterRiskEndFrom(e.target.value); setPage(1); }} placeholder="From" id="filter-risk-end-from" />
                  <span style={{ alignSelf: "center", color: "#94a3b8", fontSize: 12 }}>to</span>
                  <input type="date" className="form-input" style={{ fontSize: 12, padding: "6px 8px" }} value={filterRiskEndTo} onChange={(e) => { setFilterRiskEndTo(e.target.value); setPage(1); }} placeholder="To" id="filter-risk-end-to" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="section-card">
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{ cursor: col.sortable ? "pointer" : "default" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {col.label}
                      {col.sortable && <SortIcon col={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {COLUMNS.map((col) => (
                      <td key={col.key}>
                        <div className="skeleton" style={{ height: 14, width: "80%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : policies.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
                    <Search size={36} style={{ margin: "0 auto 12px", opacity: 0.3, display: "block" }} />
                    <p style={{ fontSize: 15 }}>No policies found</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr
                    key={policy.id}
                    onClick={() => router.push(`/policies/${policy.id}`)}
                  >
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {policy.customerName}
                        {policy.customerNo && (
                          <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b", marginLeft: 6 }}>
                            ({policy.customerNo})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{policy.mobileNo}</div>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: "monospace", fontSize: 12,
                        background: "#f1f5f9", padding: "3px 8px",
                        borderRadius: 4, fontWeight: 600
                      }}>
                        {policy.vehicleNo}
                      </span>
                    </td>
                    <td style={{ color: "#475569", fontSize: 13 }}>{policy.vehicleModel}</td>
                    <td style={{ fontSize: 13 }}>{policy.insuranceComp}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        padding: "2px 7px", borderRadius: 4,
                        background: policy.vehicleType === "PVT" ? "#e0f2fe" : "#fce7f3",
                        color: policy.vehicleType === "PVT" ? "#0284c7" : "#be185d"
                      }}>
                        {policy.vehicleType}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{policy.policyNo}</td>
                    <td style={{ fontWeight: 500 }}>{formatDate(policy.riskEndDate)}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(policy.premium)}</td>
                    <td>
                      <StatusBadge riskEndDate={policy.riskEndDate} showDays threshold={expiringSoonDays} />
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <span>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} records
            </span>
            <div className="pagination-buttons">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return p <= totalPages ? (
                  <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ) : null;
              })}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</button>
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, background: "#fee2e2", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={20} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Delete Policy</h3>
                <p style={{ fontSize: 13, color: "#64748b" }}>This action can be recovered later</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "#475569", marginBottom: 24 }}>
              Are you sure you want to delete the policy for <strong>{deleteModal.name}</strong>? The record will be soft-deleted and can be recovered by an admin.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setDeleteModal(null)} id="modal-cancel">
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteModal.id)} id="modal-delete-confirm">
                Delete Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}
    </div>
  );
}
