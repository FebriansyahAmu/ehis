// Seed Katalog BMHP/BHP (master.bmhp) dari src/lib/master/bmhpSeed.ts. Pakai `pg`
// langsung (hindari resolusi alias `@/`). Idempoten: TRUNCATE lalu insert ulang
// (katalog awal otoritatif). Kode auto-gen BHP-<periode><NNN> (pola Service).
//
//   Jalankan:  node --env-file=.env prisma/scripts/seed-bmhp.mts

import pg from "pg";
import { randomUUID } from "node:crypto";
import { BMHP_SEED } from "../../src/lib/master/bmhpSeed.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set (jalankan: node --env-file=.env prisma/scripts/seed-bmhp.mts).");
  process.exit(1);
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
/** Periode "YYMM" zona WIB — sama dgn bmhpService.bmhpPeriode. */
function seedPeriode() {
  const wib = new Date(Date.now() + WIB_OFFSET_MS);
  const yy = String(wib.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}${mm}`;
}

const client = new pg.Client({ connectionString: url });

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query('TRUNCATE "master"."bmhp", "master"."bmhp_counter" CASCADE');

    const periode = seedPeriode();
    let n = 0;

    for (const b of BMHP_SEED) {
      const id = randomUUID();
      const kode = `BHP-${periode}${String(n + 1).padStart(3, "0")}`; // auto-gen, sama pola Service

      await client.query(
        `INSERT INTO "master"."bmhp" (
           "id","kode","nama","merek","pabrik","kategori","ukuran","satuan","isi_per_kemasan",
           "is_steril","is_single_use","is_implan","kelas_risiko","is_formularium",
           "nomor_izin_edar","kode_e_katalog","harga_satuan","hpp","het","bpjs_coverage",
           "catatan","status","updated_at"
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22, now()
         )`,
        [
          id, kode, b.nama, b.merek ?? null, b.pabrik ?? null,
          b.kategori, b.ukuran ?? null, b.satuan, b.isiPerKemasan ?? null,
          b.isSteril ?? false, b.isSingleUse ?? true, b.isImplan ?? false,
          b.kelasRisiko ?? null, b.isFormularium ?? false,
          b.nomorIzinEdar ?? null, b.kodeEKatalog ?? null,
          b.hargaSatuan ?? 0, b.hpp ?? null, b.het ?? null, b.bpjsCoverage ?? false,
          b.catatan ?? null, b.status ?? "Aktif",
        ],
      );
      n += 1;
    }

    // Counter = seq terakhir → BMHP baru via API lanjut dari BHP-<periode><n+1>.
    await client.query(
      `INSERT INTO "master"."bmhp_counter" ("periode","last_seq") VALUES ($1,$2)`,
      [periode, n],
    );

    await client.query("COMMIT");
    const last = String(n).padStart(3, "0");
    console.log(`✅ Seed BMHP selesai: ${n} item · kode BHP-${periode}001..${last} · counter[${periode}]=${n}.`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌ Seed BMHP gagal:", e);
  process.exit(1);
});
