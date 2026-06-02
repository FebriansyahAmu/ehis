-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "bpjs";

-- CreateEnum
CREATE TYPE "bpjs"."JenisPelayananSep" AS ENUM ('RawatInap', 'RawatJalan');

-- CreateEnum
CREATE TYPE "bpjs"."TujuanKunjungan" AS ENUM ('Normal', 'Prosedur', 'KonsulDokter');

-- CreateEnum
CREATE TYPE "bpjs"."LakaLantas" AS ENUM ('BKLL', 'KLL_BKK', 'KLL_KK', 'KK');

-- CreateEnum
CREATE TYPE "bpjs"."AsalRujukan" AS ENUM ('Faskes1', 'Faskes2');

-- CreateEnum
CREATE TYPE "bpjs"."SumberRujukan" AS ENUM ('RujukanMasuk', 'KontrolPascaRanap', 'RujukanIGD');

-- CreateEnum
CREATE TYPE "bpjs"."SepStatus" AS ENUM ('Draft', 'Terbit', 'Batal', 'Gagal');

-- CreateEnum
CREATE TYPE "encounter"."KunjunganUnit" AS ENUM ('IGD', 'RawatJalan', 'RawatInap');

-- CreateEnum
CREATE TYPE "encounter"."KunjunganStatus" AS ENUM ('Registered', 'Queued', 'InService', 'Completed', 'Closed', 'Billed', 'Claimed', 'Cancelled');

-- DropForeignKey
ALTER TABLE "encounter"."encounter" DROP CONSTRAINT "encounter_patient_id_fkey";

-- DropTable
DROP TABLE "encounter"."encounter";

-- DropEnum
DROP TYPE "encounter"."EncounterStatus";

-- DropEnum
DROP TYPE "encounter"."EncounterUnit";

-- CreateTable
CREATE TABLE "bpjs"."rujukan" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "sumber" "bpjs"."SumberRujukan" NOT NULL,
    "asal_rujukan" "bpjs"."AsalRujukan" NOT NULL DEFAULT 'Faskes1',
    "no_rujukan" TEXT NOT NULL,
    "tgl_rujukan" DATE,
    "ppk_rujukan" TEXT,
    "diagnosa_kode" TEXT,
    "diagnosa_nama" TEXT,
    "poli_tujuan" TEXT,
    "no_sep_asal" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "rujukan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bpjs"."sep" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "rujukan_id" UUID,
    "status" "bpjs"."SepStatus" NOT NULL DEFAULT 'Draft',
    "no_sep" TEXT,
    "no_kartu" TEXT NOT NULL,
    "tgl_sep" DATE NOT NULL,
    "ppk_pelayanan" TEXT NOT NULL,
    "jns_pelayanan" "bpjs"."JenisPelayananSep" NOT NULL,
    "kls_rawat_hak" TEXT,
    "no_mr" TEXT,
    "naik_kelas" BOOLEAN NOT NULL DEFAULT false,
    "kls_rawat_naik" TEXT,
    "pembiayaan" TEXT,
    "penanggung_jawab" TEXT,
    "tujuan_kunj" "bpjs"."TujuanKunjungan" NOT NULL DEFAULT 'Normal',
    "flag_procedure" TEXT,
    "kd_penunjang" TEXT,
    "assesment_pel" TEXT,
    "poli_eksekutif" BOOLEAN NOT NULL DEFAULT false,
    "dpjp_layan" TEXT,
    "poli_tujuan" TEXT,
    "diag_awal" TEXT,
    "laka_lantas" "bpjs"."LakaLantas" NOT NULL DEFAULT 'BKLL',
    "no_lp" TEXT,
    "tgl_kejadian" DATE,
    "keterangan_laka" TEXT,
    "suplesi" BOOLEAN NOT NULL DEFAULT false,
    "no_sep_suplesi" TEXT,
    "lokasi_kd_prop" TEXT,
    "lokasi_kd_kab" TEXT,
    "lokasi_kd_kec" TEXT,
    "cob" BOOLEAN NOT NULL DEFAULT false,
    "katarak" BOOLEAN NOT NULL DEFAULT false,
    "skdp_no_surat" TEXT,
    "skdp_kode_dpjp" TEXT,
    "no_telp" TEXT,
    "catatan" TEXT,
    "user_pembuat" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "sep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounter"."kunjungan" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "unit" "encounter"."KunjunganUnit" NOT NULL,
    "status" "encounter"."KunjunganStatus" NOT NULL DEFAULT 'Registered',
    "no_kunjungan" TEXT NOT NULL,
    "no_pendaftaran" TEXT,
    "waktu_kunjungan" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "antrean_kodebooking" TEXT,
    "dpjp_id" UUID,
    "poli" TEXT,
    "kelas" "encounter"."KelasRawat",
    "bed_id" UUID,
    "triase_level" INTEGER,
    "cara_datang" TEXT,
    "asal_masuk" TEXT,
    "call_state" "encounter"."CallState",
    "recall_count" INTEGER NOT NULL DEFAULT 0,
    "cara_masuk" TEXT,
    "keluhan" TEXT,
    "diagnosa_masuk" TEXT,
    "kode_icd_masuk" TEXT,
    "penjamin_tipe" "pendaftaran"."TipePenjamin" NOT NULL DEFAULT 'Umum',
    "penjamin_id" UUID,
    "invoice_id" UUID,
    "locked_at" TIMESTAMPTZ(3),
    "selesai_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "kunjungan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rujukan_kunjungan_id_key" ON "bpjs"."rujukan"("kunjungan_id");

-- CreateIndex
CREATE INDEX "rujukan_no_rujukan_idx" ON "bpjs"."rujukan"("no_rujukan");

-- CreateIndex
CREATE UNIQUE INDEX "sep_kunjungan_id_key" ON "bpjs"."sep"("kunjungan_id");

-- CreateIndex
CREATE UNIQUE INDEX "sep_rujukan_id_key" ON "bpjs"."sep"("rujukan_id");

-- CreateIndex
CREATE UNIQUE INDEX "sep_no_sep_key" ON "bpjs"."sep"("no_sep");

-- CreateIndex
CREATE INDEX "sep_status_idx" ON "bpjs"."sep"("status");

-- CreateIndex
CREATE INDEX "sep_no_sep_idx" ON "bpjs"."sep"("no_sep");

-- CreateIndex
CREATE UNIQUE INDEX "kunjungan_no_kunjungan_key" ON "encounter"."kunjungan"("no_kunjungan");

-- CreateIndex
CREATE UNIQUE INDEX "kunjungan_antrean_kodebooking_key" ON "encounter"."kunjungan"("antrean_kodebooking");

-- CreateIndex
CREATE UNIQUE INDEX "kunjungan_invoice_id_key" ON "encounter"."kunjungan"("invoice_id");

-- CreateIndex
CREATE INDEX "kunjungan_unit_status_created_at_idx" ON "encounter"."kunjungan"("unit", "status", "created_at");

-- CreateIndex
CREATE INDEX "kunjungan_patient_id_idx" ON "encounter"."kunjungan"("patient_id");

-- CreateIndex
CREATE INDEX "kunjungan_penjamin_id_idx" ON "encounter"."kunjungan"("penjamin_id");

-- CreateIndex
CREATE INDEX "kunjungan_dpjp_id_idx" ON "encounter"."kunjungan"("dpjp_id");

-- CreateIndex
CREATE INDEX "kunjungan_created_at_id_idx" ON "encounter"."kunjungan"("created_at", "id");

-- AddForeignKey
ALTER TABLE "bpjs"."rujukan" ADD CONSTRAINT "rujukan_kunjungan_id_fkey" FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bpjs"."sep" ADD CONSTRAINT "sep_kunjungan_id_fkey" FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bpjs"."sep" ADD CONSTRAINT "sep_rujukan_id_fkey" FOREIGN KEY ("rujukan_id") REFERENCES "bpjs"."rujukan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter"."kunjungan" ADD CONSTRAINT "kunjungan_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "pendaftaran"."pasien"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter"."kunjungan" ADD CONSTRAINT "kunjungan_penjamin_id_fkey" FOREIGN KEY ("penjamin_id") REFERENCES "pendaftaran"."pasien_penjamin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── DB guarantees — di luar model Prisma (drift-safe) ────────────────────────
-- Triase IGD valid 1..5 (bila terisi).
ALTER TABLE "encounter"."kunjungan"
  ADD CONSTRAINT "kunjungan_triase_range_chk"
  CHECK ("triase_level" IS NULL OR "triase_level" BETWEEN 1 AND 5);
-- Counter panggil ulang tak boleh negatif.
ALTER TABLE "encounter"."kunjungan"
  ADD CONSTRAINT "kunjungan_recall_nonneg_chk" CHECK ("recall_count" >= 0);
