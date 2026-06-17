// Apply: kode Unit/Ruangan/Bed → partial unique (WHERE deleted_at IS NULL) via pg langsung
// (tsx tak terpasang). Jalankan: node --env-file=.env prisma/scripts/apply-ruangan-kode-partial-unique.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260617130000_ruangan_kode_partial_unique/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const idx = await c.query(
    `SELECT indexname FROM pg_indexes
     WHERE schemaname='master' AND indexname LIKE '%_kode_%key' ORDER BY indexname`,
  );
  console.log("OK index kode:", idx.rows.map((r) => r.indexname).join(", "));
} finally {
  await c.end();
}
