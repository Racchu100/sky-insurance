import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const [
    totalActive,
    expiringThisMonth,
    expiredCount,
    newThisMonth,
    premiumThisMonth,
    expiringPolicies,
  ] = await Promise.all([
    // Active policies (end date > today)
    prisma.policy.count({
      where: { isDeleted: false, riskEndDate: { gt: thirtyDaysFromNow } },
    }),
    // Expiring within 30 days
    prisma.policy.count({
      where: {
        isDeleted: false,
        riskEndDate: { gte: today, lte: thirtyDaysFromNow },
      },
    }),
    // Expired
    prisma.policy.count({
      where: { isDeleted: false, riskEndDate: { lt: today } },
    }),
    // New policies this month
    prisma.policy.count({
      where: {
        isDeleted: false,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    // Total premium this month
    prisma.policy.aggregate({
      where: {
        isDeleted: false,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { premium: true },
    }),
    // Policies expiring in next 30 days (for widget)
    prisma.policy.findMany({
      where: {
        isDeleted: false,
        riskEndDate: { gte: today, lte: thirtyDaysFromNow },
      },
      orderBy: { riskEndDate: "asc" },
      take: 10,
      select: {
        id: true,
        customerName: true,
        vehicleNo: true,
        vehicleModel: true,
        insuranceComp: true,
        riskEndDate: true,
        premium: true,
        mobileNo: true,
      },
    }),
  ]);

  return NextResponse.json({
    totalActive,
    expiringThisMonth,
    expiredCount,
    newThisMonth,
    premiumThisMonth: premiumThisMonth._sum.premium || 0,
    expiringPolicies,
  });
}
