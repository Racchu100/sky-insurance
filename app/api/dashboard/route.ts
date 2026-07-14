import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await prisma.systemSetting.findUnique({
    where: { key: "expiringSoonDays" },
  });
  const expiringSoonDays = setting ? parseInt(setting.value, 10) : 30;

  const today = new Date();
  const currentYear = today.getFullYear();
  const isCurrentFYSameYear = today.getMonth() >= 3;
  const fyStartYear = isCurrentFYSameYear ? currentYear : currentYear - 1;

  const currentFYStart = new Date(fyStartYear, 3, 1);
  const currentFYEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const prevFYStart = new Date(fyStartYear - 1, 3, 1);
  const prevFYEnd = new Date(fyStartYear - 1, today.getMonth(), today.getDate(), 23, 59, 59);

  const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfPrevMonth = new Date(today.getFullYear() - 1, today.getMonth(), 1);
  const endOfPrevMonth = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate(), 23, 59, 59);

  const thresholdDate = new Date();
  thresholdDate.setDate(today.getDate() + expiringSoonDays);

  const [
    totalActive,
    expiringThisMonth,
    expiredCount,
    newThisMonth,
    expiringPolicies,
    currentYTDRes,
    prevYTDRes,
    currentMTDRes,
    prevMTDRes,
  ] = await Promise.all([
    // Active policies (end date > thresholdDate)
    prisma.policy.count({
      where: { isDeleted: false, riskEndDate: { gt: thresholdDate } },
    }),
    // Expiring within threshold
    prisma.policy.count({
      where: {
        isDeleted: false,
        riskEndDate: { gte: today, lte: thresholdDate },
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
        createdAt: { gte: startOfCurrentMonth, lte: currentFYEnd },
      },
    }),
    // Policies expiring within threshold (for widget)
    prisma.policy.findMany({
      where: {
        isDeleted: false,
        riskEndDate: { gte: today, lte: thresholdDate },
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
    // Current YTD Premium
    prisma.policy.aggregate({
      where: { isDeleted: false, date: { gte: currentFYStart, lte: currentFYEnd } },
      _sum: { premium: true },
    }),
    // Prev YTD Premium
    prisma.policy.aggregate({
      where: { isDeleted: false, date: { gte: prevFYStart, lte: prevFYEnd } },
      _sum: { premium: true },
    }),
    // Current MTD Premium
    prisma.policy.aggregate({
      where: { isDeleted: false, date: { gte: startOfCurrentMonth, lte: currentFYEnd } },
      _sum: { premium: true },
    }),
    // Prev MTD Premium
    prisma.policy.aggregate({
      where: { isDeleted: false, date: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
      _sum: { premium: true },
    }),
  ]);

  const currentYTD = currentYTDRes._sum.premium || 0;
  const prevYTD = prevYTDRes._sum.premium || 0;
  const currentMTD = currentMTDRes._sum.premium || 0;
  const prevMTD = prevMTDRes._sum.premium || 0;

  const shortMonth = today.toLocaleString("en-US", { month: "short" });
  const currentFYSuffix = `${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
  const prevFYSuffix = `${fyStartYear - 1}-${String(fyStartYear).slice(-2)}`;

  const getPercentageChange = (current: number, prev: number) => {
    if (prev === 0) {
      return current > 0 ? { value: "∞", type: "up" } : { value: "0", type: "flat" };
    }
    const diff = current - prev;
    const pct = Math.round((diff / prev) * 100);
    if (pct > 0) return { value: `+${pct}`, type: "up" };
    if (pct < 0) return { value: `${pct}`, type: "down" };
    return { value: "0", type: "flat" };
  };

  return NextResponse.json({
    totalActive,
    expiringThisMonth,
    expiredCount,
    newThisMonth,
    expiringPolicies,
    expiringSoonDays,
    premiumThisMonth: currentMTD,
    premiumCollected: {
      yearly: {
        currentValue: currentYTD,
        prevValue: prevYTD,
        percentage: getPercentageChange(currentYTD, prevYTD),
        labels: {
          current: `Collected till ${shortMonth} ${currentFYSuffix}`,
          prev: `Collected till ${shortMonth} ${prevFYSuffix}`,
        },
      },
      monthly: {
        currentValue: currentMTD,
        prevValue: prevMTD,
        percentage: getPercentageChange(currentMTD, prevMTD),
        labels: {
          current: `Collected in ${shortMonth} ${currentFYSuffix}`,
          prev: `Collected in ${shortMonth} ${prevFYSuffix}`,
        },
      },
    },
  });
}
