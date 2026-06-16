// Seed Master Status Enum (master.enum_entry + master.enum_counter) dari
// src/lib/master/statusEnumSeed.ts. Pakai `pg` langsung (hindari alias `@/`). KODE
// di-GENERATE `<PREFIX>-NNN` per grup (urutan array) — counter di-set ke jumlah entri per
// grup → entri baru via API lanjut dari <PREFIX>-<n+1>. Idempoten: hapus semua + insert ulang.
//
//   Jalankan:  node --env-file=.env prisma/scripts/seed-statusEnum.mts

import pg from "pg";
import { randomUUID } from "node:crypto";
import { STATUS_ENUM_SEED, formatEnumKode } from "../../src/lib/master/statusEnumSeed.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set (jalankan: node --env-file=.env prisma/scripts/seed-statusEnum.mts).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query(`DELETE FROM "master"."enum_entry"`);
    await client.query(`DELETE FROM "master"."enum_counter"`);

    let total = 0;
    for (const g of STATUS_ENUM_SEED) {
      g.entries.forEach(() => total++);
      for (let i = 0; i < g.entries.length; i++) {
        const e = g.entries[i];
        const seq = i + 1; // urutan array → seq kode
        await client.query(
          `INSERT INTO "master"."enum_entry" (
             "id","group_key","kode","label","deskripsi","tone","icon","urutan","status","updated_at"
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())`,
          [
            randomUUID(), g.key, formatEnumKode(g.prefix, seq), e.label, e.deskripsi ?? "",
            e.tone, e.icon ?? null, e.urutan, e.status,
          ],
        );
      }
      // Counter per grup = jumlah entri (seq tertinggi).
      await client.query(
        `INSERT INTO "master"."enum_counter" ("scope","last_seq") VALUES ($1,$2)`,
        [g.prefix, g.entries.length],
      );
    }

    await client.query("COMMIT");
    const counters = STATUS_ENUM_SEED.map((g) => `${g.prefix}=${g.entries.length}`).join(" · ");
    console.log(`✅ Seed Status Enum selesai: ${total} entri · ${STATUS_ENUM_SEED.length} grup/counter (${counters}).`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌ Seed Status Enum gagal:", e);
  process.exit(1);
});
