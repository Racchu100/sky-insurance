import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const insuranceComp = searchParams.get("insuranceComp") || "";
  const vehicleType = searchParams.get("vehicleType") || "";
  const refAgent = searchParams.get("refAgent") || "";
  const status = searchParams.get("status") || "";

  // Date Range Filters
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const riskStartFrom = searchParams.get("riskStartFrom") || "";
  const riskStartTo = searchParams.get("riskStartTo") || "";
  const riskEndFrom = searchParams.get("riskEndFrom") || "";
  const riskEndTo = searchParams.get("riskEndTo") || "";

  const where: Record<string, unknown> = {
    isDeleted: false,
    ...(search && {
      OR: [
        { customerName: { contains: search } },
        { vehicleNo: { contains: search } },
        { mobileNo: { contains: search } },
        { policyNo: { contains: search } },
      ],
    }),
    ...(insuranceComp && { insuranceComp }),
    ...(vehicleType && { vehicleType }),
    ...(refAgent && { refAgent: { contains: refAgent } }),
  };

  // Policy Date filter range
  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo + "T23:59:59.999Z") }),
    };
  }

  // Risk Start Date filter range
  if (riskStartFrom || riskStartTo) {
    where.riskStartDate = {
      ...(riskStartFrom && { gte: new Date(riskStartFrom) }),
      ...(riskStartTo && { lte: new Date(riskStartTo + "T23:59:59.999Z") }),
    };
  }

  // Combine status and custom range for riskEndDate
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  today.setHours(0, 0, 0, 0);

  let statusFilter: Record<string, Date> = {};
  if (status === "EXPIRED") {
    statusFilter = { lt: today };
  } else if (status === "EXPIRING_SOON") {
    statusFilter = { gte: today, lte: thirtyDaysFromNow };
  } else if (status === "ACTIVE") {
    statusFilter = { gt: thirtyDaysFromNow };
  }

  if (status || riskEndFrom || riskEndTo) {
    where.riskEndDate = {
      ...statusFilter,
      ...(riskEndFrom && { gte: new Date(riskEndFrom) }),
      ...(riskEndTo && { lte: new Date(riskEndTo + "T23:59:59.999Z") }),
    };
  }

  const policies = await prisma.policy.findMany({
    where,
    orderBy: { riskEndDate: "asc" },
    include: { createdBy: { select: { name: true } } },
  });

  // Build Excel rows
  const rows = policies.map((p) => ({
    "Policy No": p.policyNo,
    Date: new Date(p.date).toLocaleDateString("en-IN"),
    "Customer Name": p.customerName,
    "Mobile No": p.mobileNo,
    "Ref Agent": p.refAgent || "",
    "Vehicle No": p.vehicleNo,
    "Vehicle Model": p.vehicleModel,
    "Vehicle Type": p.vehicleType === "PVT" ? "Private" : "Commercial",
    "Insurance Company": p.insuranceComp,
    "Risk Start Date": new Date(p.riskStartDate).toLocaleDateString("en-IN"),
    "Risk End Date": new Date(p.riskEndDate).toLocaleDateString("en-IN"),
    "OD (Rs.)": p.od,
    "Net Premium (Rs.)": p.netPremium,
    "GST (Rs.)": p.gst,
    "Premium (Rs.)": p.premium,
    "Investment (Rs.)": p.investment,
    "Created By": p.createdBy?.name || "",
    "Created At": new Date(p.createdAt).toLocaleDateString("en-IN"),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Policies");

  // Auto-size columns
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  worksheet["!cols"] = colWidths;

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="policies-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
