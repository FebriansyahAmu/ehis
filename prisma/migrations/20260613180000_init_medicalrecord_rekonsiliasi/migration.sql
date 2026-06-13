-- Rekam Medis — tab Rekonsiliasi (medication reconciliation per fase transisi). Append-only
-- parent+child (pola asesmen_obat): rekonsiliasi (per kunjungan/fase) + rekonsiliasi_obat (baris obat).
-- FK cross-schema → encounter.kunjungan (cascade); child → rekonsiliasi (cascade). Aditif murni.

-- CreateTable
CREATE TABLE "medicalrecord"."rekonsiliasi" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "fase" TEXT NOT NULL,
    "selesai" BOOLEAN NOT NULL DEFAULT false,
    "catatan" TEXT,
    "waktu" TIMESTAMPTZ(3) NOT NULL,
    "petugas" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rekonsiliasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."rekonsiliasi_obat" (
    "id" UUID NOT NULL,
    "rekonsiliasi_id" UUID NOT NULL,
    "nama_obat" TEXT NOT NULL,
    "dosis" TEXT,
    "rute" TEXT,
    "frekuensi" TEXT,
    "sumber" TEXT,
    "keputusan" TEXT NOT NULL,
    "ganti_dengan" TEXT,
    "alasan" TEXT,
    "is_ham" BOOLEAN NOT NULL DEFAULT false,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rekonsiliasi_obat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rekonsiliasi_kunjungan_id_created_at_idx" ON "medicalrecord"."rekonsiliasi"("kunjungan_id", "created_at");

-- CreateIndex
CREATE INDEX "rekonsiliasi_obat_rekonsiliasi_id_idx" ON "medicalrecord"."rekonsiliasi_obat"("rekonsiliasi_id");

-- AddForeignKey
ALTER TABLE "medicalrecord"."rekonsiliasi" ADD CONSTRAINT "rekonsiliasi_kunjungan_id_fkey" FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalrecord"."rekonsiliasi_obat" ADD CONSTRAINT "rekonsiliasi_obat_rekonsiliasi_id_fkey" FOREIGN KEY ("rekonsiliasi_id") REFERENCES "medicalrecord"."rekonsiliasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
