-- Rekam Medis — Rujukan Eksternal / Rujukan Keluar (tab Disposisi Rawat Jalan → Rujuk Eksternal).
-- rujukan_eksternal = surat rujukan KELUAR peserta JKN (V-Claim Rujukan/insert) per kunjungan.
-- LIST append-only (1 kunjungan boleh >1 rujukan) + soft-delete (batal = koreksi administratif,
-- baris dipertahankan + stamp deleted_at, pola surat_keterangan_sakit). nomor = No. Rujukan
-- {PPK}{MMYY}B{6} auto counter (reset per bulan). detail JSONB = snapshot penuh surat (peserta/
-- diagnosa/tujuan/tgl/…) → sumber CETAK ULANG mandiri. BPJS issuance = MOCK (belum cons-id prod).
-- FK → encounter.kunjungan cascade. Gate clinical.rekammedis + ABAC careUnit (route()).

-- CreateTable
CREATE TABLE "medicalrecord"."rujukan_eksternal" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "nomor" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "pencatat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rujukan_eksternal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."rujukan_eksternal_counter" (
    "scope" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rujukan_eksternal_counter_pkey" PRIMARY KEY ("scope")
);

-- CreateIndex
CREATE UNIQUE INDEX "rujukan_eksternal_nomor_key" ON "medicalrecord"."rujukan_eksternal"("nomor");
CREATE INDEX "rujukan_eksternal_kunjungan_id_deleted_at_idx" ON "medicalrecord"."rujukan_eksternal"("kunjungan_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."rujukan_eksternal"
    ADD CONSTRAINT "rujukan_eksternal_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
