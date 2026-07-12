"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Building2,
  Plus,
  Users,
  Trash2,
  UserPlus,
  Shield,
  User,
  AlertCircle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormData } from "@/lib/validators";
import { formatDate } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  isActive: boolean;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  isActive: boolean;
  createdAt: string;
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`toast ${type === "success" ? "toast-success" : "toast-error"}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [newCompany, setNewCompany] = useState("");
  const [addingCompany, setAddingCompany] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"companies" | "users">("companies");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "AGENT" },
  });

  useEffect(() => {
    fetch("/api/insurance-companies").then((r) => r.json()).then(setCompanies);
    if (isAdmin) {
      fetch("/api/users").then((r) => r.json()).then(setUsers);
    }
  }, [isAdmin]);

  const handleAddCompany = async () => {
    if (!newCompany.trim()) return;
    const res = await fetch("/api/insurance-companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCompany.trim() }),
    });
    if (res.ok) {
      const c = await res.json();
      setCompanies((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCompany("");
      setAddingCompany(false);
      showToast("Insurance company added!", "success");
    } else {
      const err = await res.json();
      showToast(err.error || "Failed to add company", "error");
    }
  };

  const handleAddUser = async (data: UserFormData) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const user = await res.json();
      setUsers((prev) => [user, ...prev]);
      reset({ role: "AGENT" });
      setAddingUser(false);
      showToast("User created successfully!", "success");
    } else {
      const err = await res.json();
      showToast(err.error || "Failed to create user", "error");
    }
  };

  const handleToggleUser = async (userId: string, isActive: boolean) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      showToast(`User ${!isActive ? "activated" : "deactivated"}`, "success");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast("User deleted", "success");
    } else {
      const err = await res.json();
      showToast(err.error || "Cannot delete user", "error");
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
        <Shield size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Admin Only</h2>
        <p>You need admin privileges to access settings.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage insurance companies and user accounts</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "white", padding: 4, borderRadius: 10, border: "1px solid #e2e8f0", width: "fit-content" }}>
        {([
          { key: "companies", label: "Insurance Companies", icon: Building2 },
          { key: "users", label: "User Management", icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="btn btn-sm"
            style={{
              background: activeTab === key ? "#0284c7" : "transparent",
              color: activeTab === key ? "white" : "#64748b",
              border: "none",
              borderRadius: 7,
              padding: "8px 16px",
              gap: 6
            }}
            id={`tab-${key}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "companies" && (
        <div className="section-card">
          <div className="section-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={17} color="#0284c7" />
              <span className="section-card-title">Insurance Companies ({companies.length})</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setAddingCompany(!addingCompany)} id="btn-add-company-settings">
              <Plus size={14} />
              Add Company
            </button>
          </div>

          {addingCompany && (
            <div style={{ padding: "14px 20px", background: "#f0f9ff", borderBottom: "1px solid #e0f2fe" }}>
              <div style={{ display: "flex", gap: 10, maxWidth: 400 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="New insurance company name..."
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCompany()}
                  id="input-new-company"
                  autoFocus
                />
                <button className="btn btn-primary" onClick={handleAddCompany} id="btn-confirm-add-company">Add</button>
                <button className="btn btn-secondary" onClick={() => { setAddingCompany(false); setNewCompany(""); }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ padding: "8px 0" }}>
            {companies.map((company, i) => (
              <div key={company.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 20px",
                borderBottom: i < companies.length - 1 ? "1px solid #f1f5f9" : "none"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "#f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#64748b"
                  }}>
                    {company.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{company.name}</span>
                </div>
                <span style={{ fontSize: 12, color: "#10b981", background: "#dcfce7", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="section-card">
          <div className="section-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={17} color="#7c3aed" />
              <span className="section-card-title">Users ({users.length})</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setAddingUser(!addingUser)} id="btn-add-user">
              <UserPlus size={14} />
              Add User
            </button>
          </div>

          {addingUser && (
            <div style={{ padding: "20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Create New User</h3>
              <form onSubmit={handleSubmit(handleAddUser)}>
                <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", padding: 0 }}>
                  <div className="form-field">
                    <label className="form-label">Full Name <span className="required">*</span></label>
                    <input className={`form-input ${errors.name ? "error" : ""}`} type="text" placeholder="John Doe" {...register("name")} id="user-name" />
                    {errors.name && <span className="form-error"><AlertCircle size={12} /> {errors.name.message}</span>}
                  </div>
                  <div className="form-field">
                    <label className="form-label">Email <span className="required">*</span></label>
                    <input className={`form-input ${errors.email ? "error" : ""}`} type="email" placeholder="user@example.com" {...register("email")} id="user-email" />
                    {errors.email && <span className="form-error"><AlertCircle size={12} /> {errors.email.message}</span>}
                  </div>
                  <div className="form-field">
                    <label className="form-label">Password <span className="required">*</span></label>
                    <input className={`form-input ${errors.password ? "error" : ""}`} type="password" placeholder="Min 6 characters" {...register("password")} id="user-password" />
                    {errors.password && <span className="form-error"><AlertCircle size={12} /> {errors.password.message}</span>}
                  </div>
                  <div className="form-field">
                    <label className="form-label">Role <span className="required">*</span></label>
                    <select className="form-input" {...register("role")} id="user-role">
                      <option value="AGENT">Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting} id="btn-create-user">
                    {isSubmitting ? "Creating..." : "Create User"}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setAddingUser(false); reset(); }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32,
                          background: user.role === "ADMIN"
                            ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                            : "linear-gradient(135deg, #0284c7, #0ea5e9)",
                          borderRadius: 8,
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {user.role === "ADMIN" ? <Shield size={14} color="white" /> : <User size={14} color="white" />}
                        </div>
                        <span style={{ fontWeight: 600 }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "#64748b", fontSize: 13 }}>{user.email}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                        background: user.role === "ADMIN" ? "#ede9fe" : "#e0f2fe",
                        color: user.role === "ADMIN" ? "#7c3aed" : "#0284c7"
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
                        background: user.isActive ? "#dcfce7" : "#fee2e2",
                        color: user.isActive ? "#16a34a" : "#dc2626"
                      }}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: 13 }}>{formatDate(user.createdAt)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleUser(user.id, user.isActive)}
                          disabled={user.id === session?.user?.id}
                          title={user.isActive ? "Deactivate" : "Activate"}
                          id={`btn-toggle-user-${user.id}`}
                          style={{ padding: "5px 8px" }}
                        >
                          {user.isActive ? <ToggleRight size={14} color="#16a34a" /> : <ToggleLeft size={14} />}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === session?.user?.id}
                          title="Delete user"
                          id={`btn-delete-user-${user.id}`}
                          style={{ padding: "5px 8px" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <Toast {...toast} />}
    </div>
  );
}
