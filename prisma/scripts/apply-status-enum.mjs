// Apply DDL Master Status Enum (CREATE master.enum_entry + master.enum_counter) via
// pg langsung (tsx tak terpasang). Jalankan: node --env-file=.env prisma/scripts/apply-status-enum.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260617120000_init_master_status_enum/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const cols = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='master' AND table_name='enum_entry' ORDER BY ordinal_position`,
  );
  const counter = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='master' AND table_name='enum_counter' ORDER BY ordinal_position`,
  );
  console.log("OK enum_entry kolom:", cols.rows.map((r) => r.column_name).join(", "));
  console.log("OK enum_counter kolom:", counter.rows.map((r) => r.column_name).join(", "));
} finally {
  await c.end();
}
