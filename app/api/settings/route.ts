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
  return NextResponse.json({ expiringSoonDays });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { expiringSoonDays } = await request.json();
    const days = parseInt(expiringSoonDays, 10);

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: "Invalid value. Days must be between 1 and 365." }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key: "expiringSoonDays" },
      update: { value: days.toString() },
      create: { key: "expiringSoonDays", value: days.toString() },
    });

    return NextResponse.json({ expiringSoonDays: parseInt(setting.value, 10) });
  } catch (error: unknown) {
    console.error("Failed to save settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
