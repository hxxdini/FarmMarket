import { PrismaClient } from "@/lib/generated/prisma"

// Ensure a single PrismaClient instance across hot reloads in dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // you can enable logs during debugging
    // log: ["query", "error", "warn"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma


