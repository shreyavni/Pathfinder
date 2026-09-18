import { PrismaClient } from "@prisma/client";

const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL || "";
  // When using Neon pgbouncer pooler, don't add Prisma's own connection pooling
  // as it conflicts with pgbouncer. The pooler manages connections.
  const usePgBouncer = databaseUrl.includes("pgbouncer=true");
  
  const clientOptions = {
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };
  
  if (!usePgBouncer) {
    clientOptions.datasources = {
      db: {
        url: databaseUrl + (databaseUrl.includes("?") ? "&" : "?") + "connection_limit=10&pool_timeout=20",
      },
    };
  }
  
  return new PrismaClient(clientOptions);
};

export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

// globalThis.prisma: This global variable ensures that the Prisma client instance is
// reused across hot reloads during development. Without this, each time your application
// reloads, a new instance of the Prisma client would be created, potentially leading
// to connection issues.
