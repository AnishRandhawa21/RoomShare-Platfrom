import { PrismaClient } from "@/lib/generated/prisma/client";

// Global singleton pattern for PrismaClient in Next.js
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    return globalForPrisma.prisma ?? createPrismaClient();
  }

  // In development, ensure the cached global instance has newly generated models
  if (
    !globalForPrisma.prisma ||
    !(globalForPrisma.prisma as any).localityRequest ||
    !(globalForPrisma.prisma as any).auditLog
  ) {
    if (globalForPrisma.prisma) {
      try {
        globalForPrisma.prisma.$disconnect();
      } catch {
        // ignore disconnect errors during hot-reload
      }
    }
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

export * from "@/lib/generated/prisma/client";
