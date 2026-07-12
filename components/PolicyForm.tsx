"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { policySchema, type PolicyFormData } from "@/lib/validators";
import { AlertCircle, User, Car, FileText, IndianRupee, Plus, RefreshCw } from "lucide-react";

interface PolicyFormProps {
  defaultValues?: Partial<PolicyFormData>;
  onSubmit: (data: PolicyFormData) => Promise<void>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

interface Company {
  id: string;
  name: string;
}

function toInputDate(date: Date | string | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <label className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      {children}
      {error && (
        <span className="form-error">
          <AlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  );
}

export default function PolicyForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  mode = "create",
}: PolicyFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [addCompanyLoading, setAddCompanyLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      date: toInputDate(defaultValues?.date) || toInputDate(new Date()),
      customerName: defaultValues?.customerName || "",
      mobileNo: defaultValues?.mobileNo || "",
      refAgent: defaultValues?.refAgent || "",
      vehicleNo: defaultValues?.vehicleNo || "",
      insuranceComp: defaultValues?.insuranceComp || "",
      vehicleType: defaultValues?.vehicleType || "PVT",
      riskStartDate: toInputDate(defaultValues?.riskStartDate) || "",
      riskEndDate: toInputDate(defaultValues?.riskEndDate) || "",
      policyNo: defaultValues?.policyNo || "",
      vehicleModel: defaultValues?.vehicleModel || "",
      od: defaultValues?.od ?? 0,
      netPremium: defaultValues?.netPremium ?? 0,
      gst: defaultValues?.gst ?? 0,
      premium: defaultValues?.premium ?? 0,
      investment: defaultValues?.investment ?? 0,
    },
  });

  const watchNetPremium = watch("netPremium");
  const watchPremium = watch("premium");

  // Auto-calc GST = Premium - Net Premium
  useEffect(() => {
    const net = Number(watchNetPremium) || 0;
    const prem = Number(watchPremium) || 0;
    if (prem > 0 && net > 0) {
      const gst = Math.max(0, Math.round(prem - net));
      setValue("gst", gst);
    }
  }, [watchNetPremium, watchPremium, setValue]);

  const fetchCompanies = useCallback(async () => {
    const res = await fetch("/api/insurance-companies");
    const data = await res.json();
    setCompanies(data);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    setAddCompanyLoading(true);
    const res = await fetch("/api/insurance-companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCompanyName.trim() }),
    });
    setAddCompanyLoading(false);
    if (res.ok) {
      const company = await res.json();
      setCompanies((prev) => [...prev, company].sort((a, b) => a.name.localeCompare(b.name)));
      setValue("insuranceComp", company.name);
      setNewCompanyName("");
      setAddingCompany(false);
    }
  };

  const handleVehicleNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.toUpperCase();
    register("vehicleNo").onChange(e);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
    register("mobileNo").onChange(e);
  };
  const handleFormSubmit = async (data: PolicyFormData) => {
    const roundedData = {
      ...data,
      od: Math.round(data.od),
      netPremium: Math.round(data.netPremium),
      gst: Math.round(data.gst),
      premium: Math.round(data.premium),
      investment: Math.round(data.investment),
    };
    await onSubmit(roundedData);
  };

  const sections = [
    {
      title: "Customer Information",
      icon: <User size={16} color="#0284c7" />,
      fields: (
        <div className="form-grid">
          <FormField label="Date" required error={errors.date?.message}>
            <input type="date" className={`form-input ${errors.date ? "error" : ""}`} id="field-date" {...register("date")} />
          </FormField>
          <FormField label="Customer Name" required error={errors.customerName?.message}>
            <input type="text" placeholder="e.g. Rajesh Kumar" className={`form-input ${errors.customerName ? "error" : ""}`} id="field-customerName" {...register("customerName")} />
          </FormField>
          <FormField label="Mobile No" required error={errors.mobileNo?.message}>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              className={`form-input ${errors.mobileNo ? "error" : ""}`}
              id="field-mobileNo"
              maxLength={10}
              {...register("mobileNo")}
              onChange={handleMobileChange}
            />
          </FormField>
          <FormField label="Ref Agent" error={errors.refAgent?.message}>
            <input type="text" placeholder="Referring agent name" className="form-input" id="field-refAgent" {...register("refAgent")} />
          </FormField>
        </div>
      ),
    },
    {
      title: "Vehicle Information",
      icon: <Car size={16} color="#7c3aed" />,
      fields: (
        <div className="form-grid">
          <FormField label="Vehicle No" required error={errors.vehicleNo?.message}>
            <input
              type="text"
              placeholder="e.g. KA19AB1234"
              className={`form-input ${errors.vehicleNo ? "error" : ""}`}
              id="field-vehicleNo"
              style={{ textTransform: "uppercase" }}
              {...register("vehicleNo")}
              onChange={handleVehicleNoChange}
            />
          </FormField>
          <FormField label="Vehicle Model" required error={errors.vehicleModel?.message}>
            <input type="text" placeholder="e.g. Maruti Swift" className={`form-input ${errors.vehicleModel ? "error" : ""}`} id="field-vehicleModel" {...register("vehicleModel")} />
          </FormField>
          <FormField label="Vehicle Type" required error={errors.vehicleType?.message}>
            <select className={`form-input ${errors.vehicleType ? "error" : ""}`} id="field-vehicleType" {...register("vehicleType")}>
              <option value="PVT">Private (PVT)</option>
              <option value="COM">Commercial (COM)</option>
            </select>
          </FormField>
        </div>
      ),
    },
    {
      title: "Policy Details",
      icon: <FileText size={16} color="#16a34a" />,
      fields: (
        <div className="form-grid">
          <FormField label="Insurance Company" required error={errors.insuranceComp?.message}>
            <div style={{ display: "flex", gap: 8 }}>
              <select className={`form-input ${errors.insuranceComp ? "error" : ""}`} id="field-insuranceComp" {...register("insuranceComp")} style={{ flex: 1 }}>
                <option value="">Select company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingCompany(!addingCompany)}
                className="btn btn-secondary btn-sm"
                style={{ flexShrink: 0 }}
                id="btn-add-company"
                title="Add new insurance company"
              >
                <Plus size={14} />
              </button>
            </div>
            {addingCompany && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="New company name..."
                  className="form-input"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCompany())}
                  style={{ flex: 1, fontSize: 13 }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCompany}
                  disabled={addCompanyLoading}
                  className="btn btn-primary btn-sm"
                >
                  {addCompanyLoading ? <RefreshCw size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : "Add"}
                </button>
              </div>
            )}
          </FormField>
          <FormField label="Policy No" required error={errors.policyNo?.message}>
            <input type="text" placeholder="Unique policy number" className={`form-input ${errors.policyNo ? "error" : ""}`} id="field-policyNo" {...register("policyNo")} />
          </FormField>
          <FormField label="Risk Start Date" required error={errors.riskStartDate?.message}>
            <input type="date" className={`form-input ${errors.riskStartDate ? "error" : ""}`} id="field-riskStartDate" {...register("riskStartDate")} />
          </FormField>
          <FormField label="Risk End Date" required error={errors.riskEndDate?.message}>
            <input type="date" className={`form-input ${errors.riskEndDate ? "error" : ""}`} id="field-riskEndDate" {...register("riskEndDate")} />
          </FormField>
        </div>
      ),
    },
    {
      title: "Premium Information",
      icon: <IndianRupee size={16} color="#d97706" />,
      fields: (
        <div className="form-grid">
          <FormField label="OD (Own Damage) Rs." error={errors.od?.message}>
            <input type="number" placeholder="0" min={0} step="1" className={`form-input ${errors.od ? "error" : ""}`} id="field-od" {...register("od")} />
          </FormField>
          <FormField label="Net Premium Rs." required error={errors.netPremium?.message}>
            <input type="number" placeholder="0" min={0} step="1" className={`form-input ${errors.netPremium ? "error" : ""}`} id="field-netPremium" {...register("netPremium")} />
          </FormField>
          <FormField label="Premium (incl. GST) Rs." required error={errors.premium?.message}>
            <input type="number" placeholder="0" min={0} step="1" className={`form-input ${errors.premium ? "error" : ""}`} id="field-premium" {...register("premium")} />
          </FormField>
          <FormField label="GST Rs." error={errors.gst?.message}>
            <input
              type="number"
              placeholder="Auto-calculated"
              min={0}
              step="1"
              className={`form-input ${errors.gst ? "error" : ""}`}
              id="field-gst"
              {...register("gst")}
            />
            <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
              Auto-calculated as Premium − Net Premium
            </span>
          </FormField>
          <FormField label="Investment Rs." error={errors.investment?.message}>
            <input type="number" placeholder="0" min={0} step="1" className={`form-input ${errors.investment ? "error" : ""}`} id="field-investment" {...register("investment")} />
          </FormField>
        </div>
      ),
    },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      {sections.map((section) => (
        <div key={section.title} className="form-section">
          <div className="form-section-header">
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "white",
              border: "1px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {section.icon}
            </div>
            <span className="form-section-title">{section.title}</span>
          </div>
          {section.fields}
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
          id="btn-save-policy"
        >
          {isLoading ? (
            <>
              <span style={{
                width: 14, height: 14,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid white",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                display: "inline-block"
              }} />
              Saving...
            </>
          ) : mode === "create" ? "Save Policy" : "Update Policy"}
        </button>

        {mode === "create" && (
          <button
            type="button"
            id="btn-save-and-add"
            className="btn btn-success"
            disabled={isLoading}
            onClick={handleSubmit(async (data) => {
              await handleFormSubmit(data);
              reset({
                date: toInputDate(new Date()),
                vehicleType: "PVT",
                od: 0, netPremium: 0, gst: 0, premium: 0, investment: 0,
              });
              document.getElementById("field-customerName")?.focus();
            })}
          >
            Save & Add Another
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
}
