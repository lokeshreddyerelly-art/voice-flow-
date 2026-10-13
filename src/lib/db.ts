import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  let datasourceUrl = process.env.DATABASE_URL;

  // On Vercel Serverless environment, copy SQLite file to writable /tmp directory
  if (process.env.VERCEL) {
    const tmpDbPath = "/tmp/dev.db";
    const sourceDbPath = path.join(process.cwd(), "prisma", "dev.db");

    if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
      try {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
      } catch (err) {
        console.warn("Failed copying sqlite db to /tmp on Vercel:", err);
      }
    }
    datasourceUrl = "file:/tmp/dev.db";
  }

  return new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const DEFAULT_USER = {
  email: process.env.DEFAULT_USER_EMAIL || "lokeshreddyerelly@gmail.com",
  name: process.env.DEFAULT_USER_NAME || "Lokesh Reddy",
};

/**
 * Ensures the default demo user exists in the database
 */
export async function getOrCreateDefaultUser() {
  try {
    const user = await prisma.user.upsert({
      where: { email: DEFAULT_USER.email },
      update: {},
      create: {
        email: DEFAULT_USER.email,
        name: DEFAULT_USER.name,
      },
    });

    return user;
  } catch {
    // If concurrent insert occurs, fetch existing user
    return prisma.user.findUniqueOrThrow({
      where: { email: DEFAULT_USER.email },
    });
  }
}
