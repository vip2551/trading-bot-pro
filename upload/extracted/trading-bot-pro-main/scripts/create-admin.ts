import { db } from "../src/lib/db";
import * as bcrypt from "bcryptjs";

async function createAdmin() {
  const email = "vip25@hotmail.com";
  const password = "MR423mr";
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Create user
    const user = await db.user.upsert({
      where: { email },
      update: {
        isAdmin: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      create: {
        email,
        name: "Admin",
        password: hashedPassword,
        isAdmin: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Create subscription (ENTERPRISE plan - unlimited everything)
    await db.subscription.upsert({
      where: { userId: user.id },
      update: {
        planName: "ENTERPRISE",
        status: "ACTIVE",
        isTrial: false,
        maxTradesPerDay: -1,
        maxActiveTrades: -1,
      },
      create: {
        userId: user.id,
        planName: "ENTERPRISE",
        status: "ACTIVE",
        isTrial: false,
        maxTradesPerDay: -1,
        maxActiveTrades: -1,
      },
    });

    console.log("✅ Admin created successfully!");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);
    console.log("👑 Plan: ENTERPRISE (Unlimited)");
    console.log("⚡ Admin: YES");
  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

createAdmin();
