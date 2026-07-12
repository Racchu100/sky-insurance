import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const insuranceCompanies = [
  "ICICI Lombard",
  "HDFC ERGO",
  "New India Assurance",
  "Bajaj Allianz",
  "Tata AIG",
  "United India Insurance",
  "Oriental Insurance",
  "National Insurance",
  "Reliance General",
  "SBI General",
  "Cholamandalam MS",
  "Future Generali",
  "Iffco Tokio",
  "Royal Sundaram",
  "Digit Insurance",
];

async function main() {
  console.log("🌱 Seeding database...");

  // Seed insurance companies
  for (const name of insuranceCompanies) {
    await prisma.insuranceCompany.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✅ Seeded ${insuranceCompanies.length} insurance companies`);

  // Seed admin user
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  await prisma.user.upsert({
    where: { email: "admin@skyinsurance.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@skyinsurance.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Seeded Admin user: admin@skyinsurance.com / Admin@123");

  // Seed agent user
  const agentPassword = await bcrypt.hash("Agent@123", 12);
  await prisma.user.upsert({
    where: { email: "agent@skyinsurance.com" },
    update: {},
    create: {
      name: "Agent",
      email: "agent@skyinsurance.com",
      password: agentPassword,
      role: "AGENT",
    },
  });
  console.log("✅ Seeded Agent user: agent@skyinsurance.com / Agent@123");

  // Seed sample policies for demo
  const today = new Date();
  const samplePolicies = [
    {
      date: new Date(today.getFullYear(), today.getMonth(), 1),
      customerName: "Rajesh Kumar",
      customerNo: "CUST-1001",
      mobileNo: "9876543210",
      refAgent: "Suresh",
      vehicleNo: "KA19AB1234",
      insuranceComp: "ICICI Lombard",
      vehicleType: "PVT" as const,
      riskStartDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      riskEndDate: new Date(today.getFullYear(), today.getMonth() + 11, 30),
      policyNo: "POL-2024-001",
      vehicleModel: "Maruti Swift",
      od: 5000,
      netPremium: 8000,
      gst: 1440,
      premium: 9440,
      investment: 800,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), 5),
      customerName: "Priya Sharma",
      customerNo: "CUST-1002",
      mobileNo: "9845123456",
      refAgent: "Ramesh",
      vehicleNo: "KA01CD5678",
      insuranceComp: "HDFC ERGO",
      vehicleType: "PVT" as const,
      riskStartDate: new Date(today.getFullYear(), today.getMonth(), 1),
      riskEndDate: new Date(today.getFullYear(), today.getMonth() + 0, 20),
      policyNo: "POL-2024-002",
      vehicleModel: "Honda City",
      od: 7500,
      netPremium: 12000,
      gst: 2160,
      premium: 14160,
      investment: 1200,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth() - 1, 15),
      customerName: "Mohan Das",
      customerNo: "CUST-1003",
      mobileNo: "9900112233",
      refAgent: "Suresh",
      vehicleNo: "KA05EF9012",
      insuranceComp: "Bajaj Allianz",
      vehicleType: "COM" as const,
      riskStartDate: new Date(today.getFullYear(), today.getMonth() - 1, 15),
      riskEndDate: new Date(today.getFullYear() - 1, today.getMonth(), 14),
      policyNo: "POL-2024-003",
      vehicleModel: "TATA Ace",
      od: 3000,
      netPremium: 5500,
      gst: 990,
      premium: 6490,
      investment: 550,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), 8),
      customerName: "Anitha Reddy",
      customerNo: "CUST-1004",
      mobileNo: "9741234567",
      vehicleNo: "KA03GH3456",
      insuranceComp: "New India Assurance",
      vehicleType: "PVT" as const,
      riskStartDate: new Date(today.getFullYear(), today.getMonth(), 8),
      riskEndDate: new Date(today.getFullYear() + 1, today.getMonth(), 7),
      policyNo: "POL-2024-004",
      vehicleModel: "Hyundai i20",
      od: 6200,
      netPremium: 10000,
      gst: 1800,
      premium: 11800,
      investment: 1000,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), 10),
      customerName: "Vijay Nair",
      customerNo: "CUST-1005",
      mobileNo: "9632587410",
      refAgent: "Ramesh",
      vehicleNo: "KA09IJ7890",
      insuranceComp: "Tata AIG",
      vehicleType: "PVT" as const,
      riskStartDate: new Date(today.getFullYear(), today.getMonth(), 10),
      riskEndDate: new Date(today.getFullYear(), today.getMonth() + 0, 25),
      policyNo: "POL-2024-005",
      vehicleModel: "Toyota Innova",
      od: 9000,
      netPremium: 15000,
      gst: 2700,
      premium: 17700,
      investment: 1500,
    },
  ];

  for (const policy of samplePolicies) {
    await prisma.policy.upsert({
      where: { policyNo: policy.policyNo },
      update: {
        customerNo: policy.customerNo,
      },
      create: policy,
    });
  }
  console.log(`✅ Seeded ${samplePolicies.length} sample policies`);

  // Seed default system settings
  await prisma.systemSetting.upsert({
    where: { key: "expiringSoonDays" },
    update: {},
    create: { key: "expiringSoonDays", value: "30" },
  });
  console.log("✅ Seeded default system setting: expiringSoonDays = 30");

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
