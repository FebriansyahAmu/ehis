// Apply: tambah nilai enum master.LocationType 'Gudang_Farmasi'. Drift-safe (JANGAN migrate dev).
// Idempoten via ADD VALUE IF NOT EXISTS (autocommit — ALTER TYPE ADD VALUE tak boleh dalam txn).
// Jalankan: node --env-file=.env prisma/scripts/apply-loctype-gudang-farmasi.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260619160000_location_type_add_gudang_farmasi/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const r = await c.query(
    `SELECT enumlabel FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE t.typname = 'LocationType' AND n.nspname = 'master'
     ORDER BY e.enumsortorder`,
  );
  console.log("OK. Nilai LocationType:", r.rows.map((x) => x.enumlabel).join(", "));
} finally {
  await c.end();
}
