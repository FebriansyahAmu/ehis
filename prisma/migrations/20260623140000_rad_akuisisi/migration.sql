-- Akuisisi & Dosis Radiologi (tab Akuisisi — OPSIONAL). medicalrecord.rad_akuisisi.
-- APPEND-ONLY "latest wins": koreksi = baris baru; terbaru (created_at) = berlaku.
-- radiografer/param_teknis/proteksi/dosis = JSONB (variatif per modalitas; dosis & proteksi NULL
-- utk modalitas non-pengion USG/MRI). Dosis = catatan medico-legal (BAPETEN/DRL).
-- FK → medicalrecord.rad_order cascade. Gate ancillary.rad.worklist (radiografer pelaksana).

-- CreateTable
CREATE TABLE "medicalrecord"."rad_akuisisi" (
    "id" UUID NOT NULL,
    "rad_order_id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "radiografer" JSONB,
    "param_teknis" JSONB,
    "proteksi" JSONB,
    "dosis" JSONB,
    "mulai_at" TIMESTAMPTZ(3),
    "selesai_at" TIMESTAMPTZ(3),
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rad_akuisisi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rad_akuisisi_rad_order_id_created_at_idx" ON "medicalrecord"."rad_akuisisi"("rad_order_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."rad_akuisisi"
    ADD CONSTRAINT "rad_akuisisi_rad_order_id_fkey"
    FOREIGN KEY ("rad_order_id") REFERENCES "medicalrecord"."rad_order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
