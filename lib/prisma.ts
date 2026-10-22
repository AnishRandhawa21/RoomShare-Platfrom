import { PrismaClient } from "@prisma/client";

// Global singleton pattern for PrismaClient in Next.js
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function cleanDatabaseUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  let cleaned = raw.trim();
  // Strip accidental "DATABASE_URL=" prefix if copied into environment variable value in dashboard
  cleaned = cleaned.replace(/^DATABASE_URL\s*=\s*/i, "");
  // Strip surrounding quotes (double or single)
  cleaned = cleaned.replace(/^["']|["']$/g, "").trim();
  cleaned = cleaned.replace(/^["']|["']$/g, "").trim();
  return cleaned || undefined;
}

// 1. Sanitize process.env.DATABASE_URL and DIRECT_URL so Prisma's schema parser receives a clean protocol URL
const rawDbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DIRECT_URL;

const sanitizedDbUrl = cleanDatabaseUrl(rawDbUrl);
if (sanitizedDbUrl) {
  process.env.DATABASE_URL = sanitizedDbUrl;
}
if (process.env.DIRECT_URL) {
  const sanitizedDirect = cleanDatabaseUrl(process.env.DIRECT_URL);
  if (sanitizedDirect) {
    process.env.DIRECT_URL = sanitizedDirect;
  }
}

/**
 * Returns a robust, serverless-optimized database connection URL.
 * Automatically converts Supabase pooler session port (5432) to transaction mode (6543)
 * and configures a healthy connection pool (limit: 10, timeout: 30s) so concurrent queries
 * from Promise.all in Server Components do not time out.
 */
function getOptimizedDatabaseUrl(): string | undefined {
  const url = cleanDatabaseUrl(process.env.DATABASE_URL);
  if (!url) return undefined;

  let optimized = url;
  if (optimized.includes("pooler.supabase.com:5432")) {
    optimized = optimized.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543");
  }

  if (!optimized.includes("pgbouncer=true")) {
    optimized += (optimized.includes("?") ? "&" : "?") + "pgbouncer=true";
  }

  // Replace restrictive connection_limit=1 with 10 to support parallel RSC queries
  if (optimized.includes("connection_limit=1")) {
    optimized = optimized.replace("connection_limit=1", "connection_limit=10&pool_timeout=30");
  } else if (!optimized.includes("connection_limit=")) {
    optimized += (optimized.includes("?") ? "&" : "?") + "connection_limit=10&pool_timeout=30";
  }

  return optimized;
}

const createPrismaClient = () => {
  const url = getOptimizedDatabaseUrl();
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: ["error"],
  });
};

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    // If cached client is stale and lacks newly generated models, recreate it
    if (!(globalForPrisma.prisma as any).systemPricingPlan) {
      try {
        globalForPrisma.prisma.$disconnect();
      } catch {}
      globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

// Resilient dynamic proxy: automatically binds methods and auto-refreshes if new models are generated
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

// Explicit exports to satisfy Next.js Turbopack CJS/ESM interop
export type { Prisma } from "@prisma/client";
export {
  PrismaClient,
  Role,
  VerificationStatus,
  PropertyType,
  GenderPolicy,
  PropertyStatus,
  RoomOperationalStatus,
  FoodOffering,
  ImageType,
  EnquiryChannel,
  DietaryPreference,
  SmokingPreference,
  DrinkingPreference,
  SleepSchedule,
  OccupationPreference,
  RoommateRequestStatus,
  RoommateInterestStatus,
  FeaturedTargetType,
} from "@prisma/client";
