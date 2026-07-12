"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validators";
import { Eye, EyeOff, Shield, Lock, Mail, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #0c1a2e 0%, #0f2744 40%, #1a3a6b 100%)" }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 30% 50%, rgba(14,165,233,0.15) 0%, transparent 60%)"
        }} />
        <div style={{
          position: "absolute", top: "10%", left: "10%",
          width: 300, height: 300,
          background: "rgba(14,165,233,0.05)",
          borderRadius: "50%", filter: "blur(60px)"
        }} />

        <div style={{ position: "relative", textAlign: "center", color: "white" }}>
          <div style={{
            width: 80, height: 80,
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 32px rgba(14,165,233,0.4)"
          }}>
            <Shield size={40} color="white" />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: -0.5 }}>
            Sky Insurance
          </h1>
          <p style={{ fontSize: 18, opacity: 0.75, fontWeight: 400, marginBottom: 40 }}>
            Vehicle Policy Management Portal
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
            {[
              { icon: "🔍", title: "Instant Search", desc: "Find any policy in under 10 seconds" },
              { icon: "📊", title: "Live Dashboard", desc: "Track renewals and premium at a glance" },
              { icon: "📤", title: "Excel Export", desc: "One-click export for reconciliation" },
            ].map((item) => (
              <div key={item.title} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "14px 18px",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 15 }}>{item.title}</div>
                  <div style={{ fontSize: 13, opacity: 0.65 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div style={{
          width: "100%", maxWidth: 420,
          background: "white",
          borderRadius: 20,
          padding: "40px 36px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)"
        }}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 60, height: 60,
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              borderRadius: 14, display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 12px",
              boxShadow: "0 4px 16px rgba(14,165,233,0.35)"
            }}>
              <Shield size={30} color="white" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Sky Insurance</h1>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Vehicle Policy Management</p>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28 }}>
            Sign in to your agency portal
          </p>

          {error && (
            <div style={{
              background: "#fee2e2", border: "1px solid #fca5a5",
              borderRadius: 8, padding: "10px 14px", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 8,
              color: "#dc2626", fontSize: 14
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="form-field">
              <label className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{
                  position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", color: "#94a3b8"
                }} />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="admin@skyinsurance.com"
                  className={`form-input ${errors.email ? "error" : ""}`}
                  style={{ paddingLeft: 38 }}
                  id="login-email"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <span className="form-error">
                  <AlertCircle size={12} /> {errors.email.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{
                  position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", color: "#94a3b8"
                }} />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`form-input ${errors.password ? "error" : ""}`}
                  style={{ paddingLeft: 38, paddingRight: 40 }}
                  id="login-password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", color: "#94a3b8",
                    padding: 0, display: "flex"
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <span className="form-error">
                  <AlertCircle size={12} /> {errors.password.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
              id="login-submit"
              style={{ width: "100%", marginTop: 4 }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid white", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    display: "inline-block"
                  }} />
                  Signing in...
                </>
              ) : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: "14px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>Demo Credentials:</p>
            <p style={{ fontSize: 12, color: "#475569" }}>Admin: <strong>admin@skyinsurance.com</strong> / Admin@123</p>
            <p style={{ fontSize: 12, color: "#475569" }}>Agent: <strong>agent@skyinsurance.com</strong> / Agent@123</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
