-- Domain klinis ke-2: Observation (TTV / tanda-tanda vital) — schema medicalrecord.
-- Time-series append-only: 1 baris = 1 pengukuran; banyak baris per kunjungan.
-- statusKesadaran/shift = TEXT (vocab terkontrol divalidasi di Zod, bukan enum Postgres).

-- CreateTable
CREATE TABLE "medicalrecord"."observation" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "td_sistolik" INTEGER NOT NULL,
    "td_diastolik" INTEGER NOT NULL,
    "nadi" INTEGER NOT NULL,
    "respirasi" INTEGER NOT NULL,
    "suhu" DOUBLE PRECISION NOT NULL,
    "spo2" INTEGER NOT NULL,
    "gcs_eye" INTEGER NOT NULL,
    "gcs_verbal" INTEGER NOT NULL,
    "gcs_motor" INTEGER NOT NULL,
    "skala_nyeri" INTEGER NOT NULL,
    "berat_badan" DOUBLE PRECISION,
    "tinggi_badan" DOUBLE PRECISION,
    "status_kesadaran" TEXT NOT NULL,
    "shift" TEXT,
    "perawat" TEXT NOT NULL,
    "waktu_observasi" TIMESTAMPTZ(3) NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "observation_kunjungan_id_waktu_observasi_idx" ON "medicalrecord"."observation"("kunjungan_id", "waktu_observasi");

-- AddForeignKey (kunjungan, cross-schema same DB)
ALTER TABLE "medicalrecord"."observation"
    ADD CONSTRAINT "observation_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
