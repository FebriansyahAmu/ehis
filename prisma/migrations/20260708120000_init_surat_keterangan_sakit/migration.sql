-- Rekam Medis — Surat Keterangan Sakit (tab Surat & Dokumen).
-- surat_keterangan_sakit = surat keterangan istirahat sakit per kunjungan (PMK 269/2008 ·
-- UU 29/2004 Praktik Kedokteran). LIST append-only (1 kunjungan boleh terbitkan >1 surat) +
-- soft-delete (batal = koreksi administratif, baris dipertahankan + stamp deleted_at, pola
-- jadwal_kontrol). nomor auto sistem (counter SKS-<YYMM><NNN>, reset per bulan). tgl_selesai
-- di-hitung SERVER dari tgl_mulai + lama_hari (anti-drift). Diagnosis = rahasia medis →
-- cantumkan_diagnosa mengatur tampil/sembunyi di cetakan. pencatat = actor login.
-- FK → encounter.kunjungan cascade. Gate clinical.rekammedis + ABAC careUnit (route()) —
-- unit-agnostic, tanpa permission baru.

-- CreateTable
CREATE TABLE "medicalrecord"."surat_keterangan_sakit" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "nomor" TEXT NOT NULL,
    "tgl_periksa" TEXT NOT NULL,
    "tgl_mulai" TEXT NOT NULL,
    "tgl_selesai" TEXT NOT NULL,
    "lama_hari" INTEGER NOT NULL,
    "keperluan" TEXT NOT NULL DEFAULT '',
    "diagnosa" TEXT NOT NULL DEFAULT '',
    "cantumkan_diagnosa" BOOLEAN NOT NULL DEFAULT false,
    "pekerjaan" TEXT NOT NULL DEFAULT '',
    "instansi" TEXT NOT NULL DEFAULT '',
    "catatan" TEXT NOT NULL DEFAULT '',
    "dokter_nama" TEXT NOT NULL DEFAULT '',
    "dokter_id" UUID,
    "pencatat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surat_keterangan_sakit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."surat_sakit_counter" (
    "scope" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "surat_sakit_counter_pkey" PRIMARY KEY ("scope")
);

-- CreateIndex
CREATE UNIQUE INDEX "surat_keterangan_sakit_nomor_key" ON "medicalrecord"."surat_keterangan_sakit"("nomor");
CREATE INDEX "surat_keterangan_sakit_kunjungan_id_deleted_at_idx" ON "medicalrecord"."surat_keterangan_sakit"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."surat_keterangan_sakit"
    ADD CONSTRAINT "surat_keterangan_sakit_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
