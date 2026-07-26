// Seed master.paket_layanan + master.paket_counter dari PAKET_MOCK (tarifMock.ts).
// Item bundel di-resolve nama-nya dari TARIF_MOCK saat seed → snapshot self-contained {nama, qty}
// (tak menyimpan tarifId; master Tarif flat masih mock, jadi ref di-bekukan sebagai teks).
// Idempoten: INSERT ... WHERE NOT EXISTS (by kode). Counter di-set ke jumlah data.
// Jalankan: node --env-file=.env prisma/scripts/seed-paket-layanan.mjs

import { Client } from "pg";

// PAKET_MOCK (tarifMock.ts) dengan item sudah di-resolve nama (dari TARIF_MOCK) → self-contained.
const PAKET = [
  {
    kode: "PKT-0001", nama: "Paket IGD Dewasa", kategori: "Lainnya",
    deskripsi: "Paket tindakan IGD dasar untuk pasien dewasa",
    items: [
      { nama: "Konsultasi Dokter Umum", qty: 1 },
      { nama: "Pemasangan Infus", qty: 1 },
      { nama: "Darah Lengkap (CBC)", qty: 1 },
      { nama: "Foto Thorax AP", qty: 1 },
    ],
    hargaUmum: 550_000, hargaBpjs: 200_000, diskonPct: 10, badge: null, status: "Aktif",
  },
  {
    kode: "PKT-0002", nama: "Paket Medical Check-Up Dasar", kategori: "MCU",
    deskripsi: "Lab + thorax + konsultasi untuk karyawan / asuransi",
    items: [
      { nama: "Konsultasi Dokter Umum", qty: 1 },
      { nama: "Darah Lengkap (CBC)", qty: 1 },
      { nama: "Gula Darah Sewaktu", qty: 1 },
      { nama: "Foto Thorax AP", qty: 1 },
    ],
    hargaUmum: 430_000, hargaBpjs: 168_000, diskonPct: 15, badge: "Populer", status: "Aktif",
  },
  {
    kode: "PKT-0003", nama: "Paket Pemeriksaan Jantung", kategori: "Lainnya",
    deskripsi: "Konsultasi SpJP + EKG + lab kardiovaskular",
    items: [
      { nama: "Konsultasi Dokter Spesialis", qty: 1 },
      { nama: "EKG (Elektrokardiogram)", qty: 1 },
      { nama: "Darah Lengkap (CBC)", qty: 1 },
      { nama: "Elektrolit (Na/K/Cl)", qty: 1 },
    ],
    hargaUmum: 600_000, hargaBpjs: 177_000, diskonPct: 10, badge: null, status: "Draft",
  },
];

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  let n = 0;
  for (const p of PAKET) {
    const r = await c.query(
      `INSERT INTO "master"."paket_layanan"
         ("id","kode","nama","kategori","deskripsi","items","harga_umum","harga_bpjs","diskon_pct","badge","status","updated_at")
       SELECT gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, now()
       WHERE NOT EXISTS (
         SELECT 1 FROM "master"."paket_layanan" WHERE "kode" = $1 AND "deleted_at" IS NULL
       )`,
      [p.kode, p.nama, p.kategori, p.deskripsi, JSON.stringify(p.items),
       p.hargaUmum, p.hargaBpjs, p.diskonPct, p.badge, p.status],
    );
    n += r.rowCount;
  }

  // Counter → set minimal ke jumlah paket (agar PKT baru mulai dari NNNN berikutnya).
  await c.query(
    `INSERT INTO "master"."paket_counter" ("scope","last_seq") VALUES ('PKT', $1)
     ON CONFLICT ("scope") DO UPDATE SET "last_seq" = GREATEST("master"."paket_counter"."last_seq", EXCLUDED."last_seq")`,
    [PAKET.length],
  );

  const total = (await c.query(`SELECT COUNT(*)::int AS n FROM "master"."paket_layanan"`)).rows[0].n;
  console.log(`paket_layanan: +${n} baru (total ${total}) · counter PKT = ${PAKET.length}`);
} finally {
  await c.end();
}
