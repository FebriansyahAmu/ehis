// Apply: buat tabel master.formularium_bmhp (join BMHP ⇄ Location). Drift-safe (JANGAN migrate dev).
// Idempoten (CREATE … IF NOT EXISTS + FK guarded via pg_constraint check).
// Jalankan: node --env-file=.env prisma/scripts/apply-formularium-bmhp.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260619170000_formularium_bmhp/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const r = await c.query(
    `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'master' AND table_name = 'formularium_bmhp'
       ORDER BY ordinal_position`,
  );
  console.log("OK. Kolom formularium_bmhp:", r.rows.map((x) => x.column_name).join(", "));
} finally {
  await c.end();
}
