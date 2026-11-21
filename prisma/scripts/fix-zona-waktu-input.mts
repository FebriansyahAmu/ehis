// Koreksi SEKALI data lama zona waktu (TECH_DEBT "Zona waktu input jam", FG-154).
//
// Sebelum perbaikan RS_TIMEZONE, jam dinding dari form ("YYYY-MM-DDTHH:mm") ditempeli `Z` sehingga
// tersimpan +offset jam dari kenyataan (WIB +7 · WITA +8 · WIT +9). Skrip ini menggeser balik kolom
// yang terdampak, untuk baris yang dibuat SEBELUM perbaikan berlaku:
//
//   encounter.kunjungan.waktu_kunjungan       semua baris (satu-satunya jalur isi = form pendaftaran)
//   medicalrecord.observation.waktu_observasi baris yang jamnya dari form (|waktu − created_at| > 60 dtk);
//   medicalrecord.triase.waktu_triase         baris tanpa jam form diisi "sekarang" oleh server → tak disentuh
//   medicalrecord.intake_output.waktu
//   medicalrecord.disposisi.waktu_keluar      idem (jam selesai dari DateTimePicker)
//   encounter.kunjungan.selesai_at / selesai_pertama_at  bila sama dengan waktu_keluar disposisi yang digeser
//
// Pemakaian (Node 24, tanpa tsx):
//   node --env-file=.env prisma/scripts/fix-zona-waktu-input.mts --offset=8 --sebelum=2026-11-21T10:00:00Z
//   node --env-file=.env prisma/scripts/fix-zona-waktu-input.mts --offset=8 --sebelum=2026-11-21T10:00:00Z --apply
//
//   --offset  : selisih jam zona perangkat saat data diinput (7 / 8 / 9).
//   --sebelum : instan ber-Z saat perbaikan mulai berlaku; baris yang dibuat sesudahnya tidak disentuh.
//   tanpa --apply = dry-run (hanya hitung + contoh), semua perubahan dalam 1 transaksi.
//
// Catatan adapter Prisma (`@prisma/adapter-pg` 7.8): Date ditulis sebagai komponen UTC tanpa offset
// dan dibaca dengan offset dibuang, sehingga nilai mentah DB bergeser sebesar zona sesi DB. Semua kolom
// di atas ditulis lewat Prisma (pemetaan sama), jadi selisih antar-kolom & geser interval tetap benar;
// batas `--sebelum` dikonversi ke ruang yang sama (`timestamp AT TIME ZONE` zona sesi).

import pg from "pg";

const args = new Map(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, "").split("=");
  return [k, v ?? "true"] as const;
}));
const offset = Number(args.get("offset"));
const sebelum = new Date(args.get("sebelum") ?? "");
const apply = args.get("apply") === "true";

if (![7, 8, 9].includes(offset) || Number.isNaN(sebelum.getTime()) || !/Z$/.test(args.get("sebelum") ?? "")) {
  console.error("Wajib: --offset=7|8|9 dan --sebelum=<ISO ber-Z>, mis. --sebelum=2026-11-21T10:00:00Z");
  process.exit(1);
}

// Komponen UTC batas → ditafsirkan di zona sesi DB (ruang nilai yang sama dengan tulisan Prisma).
const cutoffNaive = sebelum.toISOString().replace("T", " ").replace("Z", "");
const CUT = `($1::timestamp AT TIME ZONE current_setting('TimeZone'))`;
const SHIFT = `interval '${offset} hours'`;
const FROM_FORM = (col: string) => `abs(extract(epoch from (${col} - created_at))) > 60`;

interface Rule { label: string; count: string; update: string }

const QUALIFY_DISPOSISI = `d.created_at < ${CUT} and abs(extract(epoch from (d.waktu_keluar - d.created_at))) > 60 and d.deleted_at is null`;

const rules: Rule[] = [
  {
    label: "kunjungan.selesai_at (sama dgn waktu_keluar disposisi dari form)",
    count: `select count(*)::int n from encounter.kunjungan k where k.selesai_at is not null and exists (select 1 from medicalrecord.disposisi d where d.kunjungan_id = k.id and d.waktu_keluar = k.selesai_at and ${QUALIFY_DISPOSISI})`,
    update: `update encounter.kunjungan k set selesai_at = k.selesai_at - ${SHIFT} where k.selesai_at is not null and exists (select 1 from medicalrecord.disposisi d where d.kunjungan_id = k.id and d.waktu_keluar = k.selesai_at and ${QUALIFY_DISPOSISI})`,
  },
  {
    label: "kunjungan.selesai_pertama_at (sama dgn waktu_keluar disposisi dari form)",
    count: `select count(*)::int n from encounter.kunjungan k where k.selesai_pertama_at is not null and exists (select 1 from medicalrecord.disposisi d where d.kunjungan_id = k.id and d.waktu_keluar = k.selesai_pertama_at and ${QUALIFY_DISPOSISI})`,
    update: `update encounter.kunjungan k set selesai_pertama_at = k.selesai_pertama_at - ${SHIFT} where k.selesai_pertama_at is not null and exists (select 1 from medicalrecord.disposisi d where d.kunjungan_id = k.id and d.waktu_keluar = k.selesai_pertama_at and ${QUALIFY_DISPOSISI})`,
  },
  {
    label: "disposisi.waktu_keluar (dari form)",
    count: `select count(*)::int n from medicalrecord.disposisi d where ${QUALIFY_DISPOSISI}`,
    update: `update medicalrecord.disposisi d set waktu_keluar = d.waktu_keluar - ${SHIFT} where ${QUALIFY_DISPOSISI}`,
  },
  {
    label: "kunjungan.waktu_kunjungan (semua)",
    count: `select count(*)::int n from encounter.kunjungan where created_at < ${CUT}`,
    update: `update encounter.kunjungan set waktu_kunjungan = waktu_kunjungan - ${SHIFT} where created_at < ${CUT}`,
  },
  {
    label: "observation.waktu_observasi (dari form)",
    count: `select count(*)::int n from medicalrecord.observation where created_at < ${CUT} and ${FROM_FORM("waktu_observasi")}`,
    update: `update medicalrecord.observation set waktu_observasi = waktu_observasi - ${SHIFT} where created_at < ${CUT} and ${FROM_FORM("waktu_observasi")}`,
  },
  {
    label: "triase.waktu_triase (dari form)",
    count: `select count(*)::int n from medicalrecord.triase where created_at < ${CUT} and ${FROM_FORM("waktu_triase")}`,
    update: `update medicalrecord.triase set waktu_triase = waktu_triase - ${SHIFT} where created_at < ${CUT} and ${FROM_FORM("waktu_triase")}`,
  },
  {
    label: "intake_output.waktu (dari form)",
    count: `select count(*)::int n from medicalrecord.intake_output where created_at < ${CUT} and ${FROM_FORM("waktu")}`,
    update: `update medicalrecord.intake_output set waktu = waktu - ${SHIFT} where created_at < ${CUT} and ${FROM_FORM("waktu")}`,
  },
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  console.log(`${apply ? "APPLY" : "DRY-RUN"} · geser −${offset} jam · baris dibuat sebelum ${sebelum.toISOString()}`);
  await client.query("begin");
  // Urutan penting: kunjungan.selesai_* dicocokkan dengan waktu_keluar SEBELUM disposisi digeser.
  for (const r of rules) {
    const { rows } = await client.query<{ n: number }>(r.count, [cutoffNaive]);
    if (apply) {
      const res = await client.query(r.update, [cutoffNaive]);
      console.log(`  ${r.label}: ${res.rowCount} baris digeser`);
    } else {
      console.log(`  ${r.label}: ${rows[0].n} baris akan digeser`);
    }
  }
  await client.query(apply ? "commit" : "rollback");
  console.log(apply ? "Selesai (commit)." : "Dry-run — tidak ada yang diubah. Tambah --apply untuk menjalankan.");
} catch (e) {
  await client.query("rollback").catch(() => {});
  console.error("Gagal, semua perubahan dibatalkan:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await client.end();
}
