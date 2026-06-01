// Prisma Client singleton (FLOWS §2). Satu instance per proses (long-running Node)
// → 1 connection pool. Cegah pembuatan ulang saat HMR dev (cache di globalThis).
//
// Prisma 7 (generator `prisma-client`, ESM) memakai DRIVER ADAPTER — koneksi via
// node-postgres (`pg`), bukan query-engine bawaan. URL dari DATABASE_URL (.env).

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __ehisPrisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum di-set (.env).");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient = globalThis.__ehisPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalThis.__ehisPrisma = prisma;

/**
 * Tipe transaksi Prisma — DAL menerima `tx?` (FLOWS §7: batas transaksi dimiliki Service).
 * Bila tak diberi, DAL pakai `prisma` global. Bila diberi, ikut transaksi pemanggil.
 */
export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/** Klien aktif untuk DAL: transaksi bila ada, else singleton. */
export function db(tx?: Tx): Tx | PrismaClient {
  return tx ?? prisma;
}

/**
 * Batas transaksi (FLOWS §7) — dipanggil Service, bukan DAL. Service mengimpor helper
 * ini (BUKAN `prisma` langsung) lalu meneruskan `tx` ke DAL. Gagal = rollback total.
 */
export function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn);
}
