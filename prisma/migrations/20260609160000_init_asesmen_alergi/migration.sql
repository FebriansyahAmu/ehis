-- Asesmen Medis · sub-menu Alergi (parent + child snapshot, append-only "latest wins").
-- Mirror AllergyPane/AllergyEntry. Satu tabel melayani semua kategori (Obat/Makanan/Lainnya).
-- Schema medicalrecord.

-- ── Parent: asesmen alergi (1 baris/simpan; nka = No Known Allergy) ─────────────
CREATE TABLE "medicalrecord"."asesmen_alergi" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "nka" BOOLEAN NOT NULL DEFAULT false,
    "pemeriksa" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_alergi_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_alergi_kunjungan_id_created_at_idx" ON "medicalrecord"."asesmen_alergi"("kunjungan_id", "created_at");
ALTER TABLE "medicalrecord"."asesmen_alergi" ADD CONSTRAINT "asesmen_alergi_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Child: item alergi (snapshot tiap entri; kategori = field) ──────────────────
CREATE TABLE "medicalrecord"."asesmen_alergi_item" (
    "id" UUID NOT NULL,
    "asesmen_alergi_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "reactions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "keterangan" TEXT,
    "snomed_code" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asesmen_alergi_item_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asesmen_alergi_item_asesmen_alergi_id_idx" ON "medicalrecord"."asesmen_alergi_item"("asesmen_alergi_id");
ALTER TABLE "medicalrecord"."asesmen_alergi_item" ADD CONSTRAINT "asesmen_alergi_item_asesmen_alergi_id_fkey"
    FOREIGN KEY ("asesmen_alergi_id") REFERENCES "medicalrecord"."asesmen_alergi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
