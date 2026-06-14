-- Rekam Medis — Asuhan Keperawatan: Evaluasi Shift (timeline SOAP per shift). schema "medicalrecord".
-- Ekstraksi dari kolom JSONB `evaluasi` (AsuhanKeperawatan) → tabel anak append-only sendiri.
-- 1 baris = 1 catatan evaluasi/shift. FK → asuhan_keperawatan (cascade). DROP kolom JSONB lama.

-- CreateTable
CREATE TABLE "medicalrecord"."asuhan_evaluasi" (
    "id" UUID NOT NULL,
    "asuhan_id" UUID NOT NULL,
    "shift" TEXT NOT NULL,
    "subjektif" TEXT,
    "objektif" TEXT NOT NULL,
    "status_luaran" TEXT NOT NULL,
    "waktu" TIMESTAMPTZ(3) NOT NULL,
    "perawat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asuhan_evaluasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asuhan_evaluasi_asuhan_id_waktu_idx" ON "medicalrecord"."asuhan_evaluasi"("asuhan_id", "waktu");

-- AddForeignKey
ALTER TABLE "medicalrecord"."asuhan_evaluasi"
    ADD CONSTRAINT "asuhan_evaluasi_asuhan_id_fkey"
    FOREIGN KEY ("asuhan_id") REFERENCES "medicalrecord"."asuhan_keperawatan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- DropColumn (evaluasi JSONB → pindah ke tabel anak)
ALTER TABLE "medicalrecord"."asuhan_keperawatan" DROP COLUMN "evaluasi";
