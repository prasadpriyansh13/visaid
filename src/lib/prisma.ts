import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 * 
 * Prevents multiple PrismaClient instances during hot reload in development.
 * In production (Render), this ensures efficient database connection pooling.
 * 
 * This pattern is recommended by Prisma for Next.js applications:
 * https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

