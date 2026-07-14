"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { policySchema, type PolicyFormData } from "@/lib/validators";
import { AlertCircle, User, Car, FileText, IndianRupee, Plus, RefreshCw, Shield } from "lucide-react";

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

const convertToWebP = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please upload an image file (PNG, JPG, JPEG, WEBP, etc.)"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not create canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const webpDataUrl = canvas.toDataURL("image/webp", 0.75);
        resolve(webpDataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

function DocumentUploadField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [converting, setConverting] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }

    setUploadError("");
    setConverting(true);
    try {
      const webpDataUrl = await convertToWebP(file);
      onChange(webpDataUrl);
    } catch (err: unknown) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : "Error converting image.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="form-field" style={{ display: "flex", flexDirection: "column" }}>
      <label className="form-label" style={{ fontWeight: 600 }}>{label}</label>

      {value ? (
        <div style={{
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          background: "#f8fafc",
          position: "relative",
          overflow: "hidden",
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(239, 68, 68, 0.9)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
            }}
            title="Remove document"
          >
            &times;
          </button>
        </div>
      ) : (
        <div style={{
          border: "2px dashed #cbd5e1",
          borderRadius: 10,
          background: "#f8fafc",
          height: 140,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          transition: "border-color 0.2s ease"
        }}>
          {converting ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <RefreshCw size={20} className="animate-spin" style={{ color: "#0284c7" }} />
              <span style={{ fontSize: 12, color: "#64748b" }}>Converting to WebP...</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 12 }}>
              <span style={{ fontSize: 13, color: "#0284c7", fontWeight: 500 }}>Upload Image</span>
              <span style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>JPEG, PNG, WEBP auto-converted</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={converting}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer"
            }}
          />
        </div>
      )}

      {(error || uploadError) && (
        <span className="form-error" style={{ marginTop: 4 }}>
          <AlertCircle size={12} /> {error || uploadError}
        </span>
      )}
    </div>
  );
}

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(script);
  });
};

const compressPDFScanned = async (file: File): Promise<string> => {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

  const pdfjsLib = (window as any).pdfjsLib;
  const { jsPDF } = (window as any).jspdf;

  if (!pdfjsLib || !jsPDF) {
    throw new Error("Failed to load PDF processing libraries from CDN.");
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const fileReader = new FileReader();
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(file);
  });

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  const newPdf = new jsPDF("p", "mm", "a4");
  const pageWidth = newPdf.internal.pageSize.getWidth();
  const pageHeight = newPdf.internal.pageSize.getHeight();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const desiredWidth = 1000;
    const viewport = page.getViewport({ scale: 1 });
    const scale = desiredWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not construct 2D canvas context.");

    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

    const imgData = canvas.toDataURL("image/jpeg", 0.6);

    if (i > 1) {
      newPdf.addPage();
    }
    newPdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight);
  }

  const compressedPdfArrayBuffer = newPdf.output("arraybuffer");
  
  const responseStream = new Response(compressedPdfArrayBuffer).body;
  if (!responseStream) {
    throw new Error("Failed to read compressed PDF stream.");
  }
  const compressedStream = responseStream.pipeThrough(new CompressionStream("gzip"));
  const response = new Response(compressedStream);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const compressPDF = (file: File): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (file.type !== "application/pdf") {
        reject(new Error("Please upload a PDF file."));
        return;
      }
      const stream = file.stream();
      const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
      const response = new Response(compressedStream);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error("Failed to read compressed file"));
      reader.readAsDataURL(blob);
    } catch (err: unknown) {
      console.error(err);
      reject(new Error("PDF compression failed. Ensure your browser supports it."));
    }
  });
};

function PDFUploadField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [compressing, setCompressing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [origSize, setOrigSize] = useState<string>("");
  const [compSize, setCompSize] = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Please select a PDF file.");
      return;
    }

    setUploadError("");
    setCompressing(true);
    setStatusMessage("Reading file...");

    const originalMb = (file.size / (1024 * 1024)).toFixed(2);
    setOrigSize(`${originalMb} MB`);

    try {
      let compressedDataUrl: string;
      if (file.size > 2.5 * 1024 * 1024) {
        setStatusMessage("Large PDF. Optimizing pages client-side...");
        compressedDataUrl = await compressPDFScanned(file);
      } else {
        setStatusMessage("Compressing PDF...");
        compressedDataUrl = await compressPDF(file);
      }
      onChange(compressedDataUrl);

      const base64Length = compressedDataUrl.split(",")[1].length;
      const compressedBytes = base64Length * 0.75;
      const compressedMb = (compressedBytes / (1024 * 1024)).toFixed(2);
      setCompSize(`${compressedMb} MB`);
    } catch (err: unknown) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : "Error compressing PDF.");
    } finally {
      setCompressing(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="form-field" style={{ display: "flex", flexDirection: "column" }}>
      <label className="form-label" style={{ fontWeight: 600 }}>{label}</label>

      {value ? (
        <div style={{
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          background: "#f8fafc",
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 140
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #fee2e2",
              flexShrink: 0
            }}>
              <FileText size={18} color="#ef4444" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>E-Policy PDF Uploaded</span>
              {origSize && compSize && (
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Compressed: {origSize} &rarr; {compSize}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOrigSize("");
              setCompSize("");
            }}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.2s",
              flexShrink: 0
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <div style={{
          border: "2px dashed #cbd5e1",
          borderRadius: 10,
          background: "#f8fafc",
          height: 140,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          transition: "border-color 0.2s ease"
        }}>
          {compressing ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 12 }}>
              <RefreshCw size={20} className="animate-spin" style={{ color: "#0284c7" }} />
              <span style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>{statusMessage}</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 12 }}>
              <span style={{ fontSize: 13, color: "#0284c7", fontWeight: 500 }}>Upload E-Policy PDF</span>
              <span style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>PDF auto-compressed client-side</span>
            </div>
          )}
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={compressing}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer"
            }}
          />
        </div>
      )}

      {(error || uploadError) && (
        <span className="form-error" style={{ marginTop: 4 }}>
          <AlertCircle size={12} /> {error || uploadError}
        </span>
      )}
    </div>
  );
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
      customerNo: defaultValues?.customerNo || "",
      mobileNo: defaultValues?.mobileNo || "",
      refAgent: defaultValues?.refAgent || "",
      vehicleNo: defaultValues?.vehicleNo || "",
      insuranceComp: defaultValues?.insuranceComp || "",
      vehicleType: defaultValues?.vehicleType || ("" as any),
      policyType: defaultValues?.policyType || ("" as any),
      riskStartDate: toInputDate(defaultValues?.riskStartDate) || "",
      riskEndDate: toInputDate(defaultValues?.riskEndDate) || "",
      policyNo: defaultValues?.policyNo || "",
      vehicleModel: defaultValues?.vehicleModel || "",
      od: defaultValues?.od ?? 0,
      netPremium: defaultValues?.netPremium ?? 0,
      gst: defaultValues?.gst ?? 0,
      premium: defaultValues?.premium ?? 0,
      investment: defaultValues?.investment ?? 0,
      aadhaarCard: defaultValues?.aadhaarCard || "",
      panCard: defaultValues?.panCard || "",
      drivingLicense: defaultValues?.drivingLicense || "",
      ePolicy: defaultValues?.ePolicy || "",
    },
  });

  const watchNetPremium = watch("netPremium");
  const watchPremium = watch("premium");
  const watchRiskStartDate = watch("riskStartDate");

  // Auto-calc GST = Premium - Net Premium
  useEffect(() => {
    const net = Number(watchNetPremium) || 0;
    const prem = Number(watchPremium) || 0;
    if (prem > 0 && net > 0) {
      const gst = Math.max(0, Math.round(prem - net));
      setValue("gst", gst);
    }
  }, [watchNetPremium, watchPremium, setValue]);

  // Auto-calc Risk End Date = Risk Start Date + 1 year - 1 day
  useEffect(() => {
    if (watchRiskStartDate) {
      const startDate = new Date(watchRiskStartDate);
      if (!isNaN(startDate.getTime())) {
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1);
        setValue("riskEndDate", toInputDate(endDate));
      }
    }
  }, [watchRiskStartDate, setValue]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/insurance-companies");
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const text = await res.text();
      if (!text) {
        setCompanies([]);
        return;
      }
      const data = JSON.parse(text);
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      setCompanies([]);
    }
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
          <FormField label="Customer No" error={errors.customerNo?.message}>
            <input type="text" placeholder="e.g. CUST-1001" className={`form-input ${errors.customerNo ? "error" : ""}`} id="field-customerNo" {...register("customerNo")} />
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
              <option value="">Select vehicle type...</option>
              <option value="PVT">Private (PVT)</option>
              <option value="COM">Commercial (COM)</option>
            </select>
          </FormField>
          <FormField label="Policy Type" required error={errors.policyType?.message}>
            <select className={`form-input ${errors.policyType ? "error" : ""}`} id="field-policyType" {...register("policyType")}>
              <option value="">Select policy type...</option>
              <option value="PACKAGE">Package</option>
              <option value="LIABILITY">Liabilities</option>
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
    {
      title: "Policy Documents & Private Info",
      icon: <Shield size={16} color="#dc2626" />,
      fields: (
        <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          <DocumentUploadField
            label="Aadhaar Card"
            value={watch("aadhaarCard")}
            onChange={(val) => setValue("aadhaarCard", val)}
            error={errors.aadhaarCard?.message}
          />
          <DocumentUploadField
            label="PAN Card"
            value={watch("panCard")}
            onChange={(val) => setValue("panCard", val)}
            error={errors.panCard?.message}
          />
          <DocumentUploadField
            label="Driving License"
            value={watch("drivingLicense")}
            onChange={(val) => setValue("drivingLicense", val)}
            error={errors.drivingLicense?.message}
          />
          <PDFUploadField
            label="E-Policy Document"
            value={watch("ePolicy")}
            onChange={(val) => setValue("ePolicy", val)}
            error={errors.ePolicy?.message}
          />
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
                aadhaarCard: "", panCard: "", drivingLicense: "", ePolicy: "",
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
