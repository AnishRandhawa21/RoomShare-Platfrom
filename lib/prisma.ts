import { PrismaClient } from "@prisma/client";

// Global singleton pattern for PrismaClient in Next.js
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Returns a robust, serverless-optimized database connection URL.
 * Automatically converts Supabase pooler session port (5432) to transaction mode (6543)
 * with pgbouncer=true to prevent FATAL: (EMAXCONNSESSION) max clients reached in session mode.
 */
function getOptimizedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  if (url.includes("pooler.supabase.com:5432")) {
    let pooled = url.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543");
    if (!pooled.includes("pgbouncer=true")) {
      pooled += (pooled.includes("?") ? "&" : "?") + "pgbouncer=true&connection_limit=1";
    }
    return pooled;
  }

  return url;
}

const createPrismaClient = () => {
  const url = getOptimizedDatabaseUrl();
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();

export * from "@prisma/client";
