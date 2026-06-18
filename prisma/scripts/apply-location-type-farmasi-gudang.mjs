// Apply: master.LocationType enum += Farmasi, Gudang via pg langsung (tsx tak terpasang).
// ALTER TYPE ADD VALUE dijalankan TERPISAH per-statement (auto-commit) — hindari batasan
// "tak boleh di blok transaksi" pada simple-query multi-statement.
// Jalankan: node --env-file=.env prisma/scripts/apply-location-type-farmasi-gudang.mjs
import { Client } from "pg";

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(`ALTER TYPE "master"."LocationType" ADD VALUE IF NOT EXISTS 'Farmasi'`);
  await c.query(`ALTER TYPE "master"."LocationType" ADD VALUE IF NOT EXISTS 'Gudang'`);
  const vals = await c.query(
    `SELECT e.enumlabel FROM pg_enum e
     JOIN pg_type t ON t.oid = e.enumtypid
     JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE t.typname = 'LocationType' AND n.nspname = 'master'
     ORDER BY e.enumsortorder`,
  );
  console.log("OK LocationType:", vals.rows.map((r) => r.enumlabel).join(", "));
} finally {
  await c.end();
}
