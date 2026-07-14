import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { policySchema } from "@/lib/validators";

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

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sortBy = searchParams.get("sortBy") || "riskEndDate";
  const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

  const where: Record<string, unknown> = {
    isDeleted: false,
    ...(search && {
      OR: [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerNo: { contains: search, mode: "insensitive" } },
        { vehicleNo: { contains: search, mode: "insensitive" } },
        { mobileNo: { contains: search, mode: "insensitive" } },
        { policyNo: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(insuranceComp && { insuranceComp }),
    ...(vehicleType && { vehicleType }),
    ...(refAgent && { refAgent: { contains: refAgent, mode: "insensitive" } }),
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

  const setting = await prisma.systemSetting.findUnique({
    where: { key: "expiringSoonDays" },
  });
  const expiringSoonDays = setting ? parseInt(setting.value, 10) : 30;

  // Combine status and custom range for riskEndDate
  const today = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(today.getDate() + expiringSoonDays);
  today.setHours(0, 0, 0, 0);

  let statusFilter: Record<string, Date> = {};
  if (status === "EXPIRED") {
    statusFilter = { lt: today };
  } else if (status === "EXPIRING_SOON") {
    statusFilter = { gte: today, lte: thresholdDate };
  } else if (status === "ACTIVE") {
    statusFilter = { gt: thresholdDate };
  }

  if (status || riskEndFrom || riskEndTo) {
    where.riskEndDate = {
      ...statusFilter,
      ...(riskEndFrom && { gte: new Date(riskEndFrom) }),
      ...(riskEndTo && { lte: new Date(riskEndTo + "T23:59:59.999Z") }),
    };
  }

  const [policies, total] = await Promise.all([
    prisma.policy.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
      },
    }),
    prisma.policy.count({ where }),
  ]);

  const mappedPolicies = policies.map((p) => {
    const { ePolicy, aadhaarCard, panCard, drivingLicense, ...rest } = p;
    return {
      ...rest,
      hasEPolicy: !!ePolicy,
      hasAadhaar: !!aadhaarCard,
      hasPan: !!panCard,
      hasDrivingLicense: !!drivingLicense,
    };
  });

  return NextResponse.json({
    policies: mappedPolicies,
    total,
    page,
    limit,
    expiringSoonDays,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const result = policySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;

  try {
    const policy = await prisma.policy.create({
      data: {
        ...data,
        date: new Date(data.date),
        riskStartDate: new Date(data.riskStartDate),
        riskEndDate: new Date(data.riskEndDate),
        createdById: session.user.id,
      },
    });
    return NextResponse.json(policy, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Policy number already exists" },
        { status: 409 }
      );
    }
    throw error;
  }
}
