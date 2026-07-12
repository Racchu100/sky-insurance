import { z } from "zod";

export const policySchema = z.object({
  date: z.string().min(1, "Date is required"),
  customerName: z.string().min(1, "Customer name is required").max(100),
  customerNo: z.string().max(50).optional().default(""),
  mobileNo: z
    .string()
    .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  refAgent: z.string().optional().default(""),
  vehicleNo: z
    .string()
    .min(1, "Vehicle number is required")
    .max(20)
    .transform((v) => v.toUpperCase()),
  insuranceComp: z.string().min(1, "Insurance company is required"),
  vehicleType: z.enum(["PVT", "COM"], {
    required_error: "Vehicle type is required",
  }),
  riskStartDate: z.string().min(1, "Risk start date is required"),
  riskEndDate: z.string().min(1, "Risk end date is required"),
  policyNo: z.string().min(1, "Policy number is required").max(50),
  vehicleModel: z.string().min(1, "Vehicle model is required").max(100),
  od: z.coerce.number().min(0).default(0),
  netPremium: z.coerce.number().min(0, "Net premium must be positive"),
  gst: z.coerce.number().min(0).default(0),
  premium: z.coerce.number().min(0, "Premium must be positive"),
  investment: z.coerce.number().min(0).default(0),
});

export type PolicyFormData = z.infer<typeof policySchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "AGENT"]),
});

export type UserFormData = z.infer<typeof userSchema>;
