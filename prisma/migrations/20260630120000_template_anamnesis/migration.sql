-- Master Template Anamnesis — tabel baru (additive, anti-drift).
-- Katalog leaf: tanpa kode/counter/optimistic-version. context_tags = subset {IGD,RI,RJ}.

CREATE TABLE "master"."template_anamnesis" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "context_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "keluhan_utama" TEXT NOT NULL,
    "rps" TEXT NOT NULL DEFAULT '',
    "onset_durasi" TEXT NOT NULL DEFAULT '',
    "mekanisme_cedera" TEXT,
    "faktor_pemberat" TEXT NOT NULL DEFAULT '',
    "faktor_pemerut" TEXT NOT NULL DEFAULT '',
    "status_generalis" TEXT NOT NULL DEFAULT '',
    "catatan_perawat" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "template_anamnesis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "template_anamnesis_status_deleted_at_idx" ON "master"."template_anamnesis"("status", "deleted_at");
