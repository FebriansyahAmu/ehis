// Seed Master Asesmen Katalog (master.asesmen_item) dari src/lib/master/asesmenKatalogMock.ts.
// Pakai `pg` langsung (hindari alias `@/`). KODE dipakai apa adanya dari mock (sudah benar:
// ALG-OB-001 / RX-001 / PD-001 …). Counter per prefix di-set ke seq tertinggi → entri baru
// via API lanjut dari <PREFIX>-<n+1>. Idempoten: hapus semua baris + counter, lalu insert ulang.
//
//   Jalankan:  node --env-file=.env prisma/scripts/seed-asesmen-katalog.mts

import pg from "pg";
import { randomUUID } from "node:crypto";
import { ASESMEN_KATALOG_MOCK } from "../../src/lib/master/asesmenKatalogMock.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set (jalankan: node --env-file=.env prisma/scripts/seed-asesmen-katalog.mts).");
  process.exit(1);
}

// Pisah kode `<PREFIX>-<NNN>` → { prefix, seq }. Generik: prefix = semua sebelum `-NNN` terakhir
// (menangani ALG-OB-001 → prefix "ALG-OB" dan RX-001 → prefix "RX").
function splitKode(kode) {
  const m = /^(.*)-(\d+)$/.exec(kode.trim());
  if (!m) return null;
  return { prefix: m[1], seq: parseInt(m[2], 10) };
}

const client = new pg.Client({ connectionString: url });

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query(`DELETE FROM "master"."asesmen_item"`);
    await client.query(`DELETE FROM "master"."asesmen_counter"`);

    const maxSeq = new Map(); // prefix → seq tertinggi

    for (const it of ASESMEN_KATALOG_MOCK) {
      const parsed = splitKode(it.kode);
      if (!parsed) throw new Error(`Kode tidak valid (butuh <PREFIX>-NNN): ${it.kode}`);
      const { prefix, seq } = parsed;
      if (seq > (maxSeq.get(prefix) ?? 0)) maxSeq.set(prefix, seq);

      await client.query(
        `INSERT INTO "master"."asesmen_item" (
           "id","kode","nama","kategori","deskripsi","snomed_code","severity_default","status","updated_at"
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())`,
        [
          randomUUID(), it.kode, it.nama, it.kategori, it.deskripsi ?? "",
          it.snomedCode ?? null,
          it.kategori === "ReaksiAlergi" ? (it.severityDefault ?? null) : null,
          it.status ?? "Aktif",
        ],
      );
    }

    for (const [prefix, seq] of maxSeq) {
      await client.query(
        `INSERT INTO "master"."asesmen_counter" ("scope","last_seq") VALUES ($1,$2)`,
        [prefix, seq],
      );
    }

    await client.query("COMMIT");
    const counters = [...maxSeq.entries()].map(([p, s]) => `${p}=${s}`).join(" · ");
    console.log(`✅ Seed Asesmen Katalog selesai: ${ASESMEN_KATALOG_MOCK.length} item · ${maxSeq.size} counter (${counters}).`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌ Seed Asesmen Katalog gagal:", e);
  process.exit(1);
});
