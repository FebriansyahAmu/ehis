-- Rekam Medis — Discharge Planning step 1: Asesmen Pemulangan (tab Discharge Planning RI,
-- SNARS ARK 5). discharge_asesmen = asesmen awal pemulangan per kunjungan, append-only
-- "latest wins" (simpan = INSERT baris baru; read ambil created_at terbaru — jejak revisi utuh).
-- Risiko re-admisi TIDAK disimpan (derivasi 3 field skrining). pencatat = actor login.
-- FK → encounter.kunjungan cascade. Gate clinical.rekammedis + ABAC careUnit (route()).
-- Step Edukasi & Checklist = tabel menyusul (fase berikut).

-- CreateTable
CREATE TABLE "medicalrecord"."discharge_asesmen" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "tanggal_rencana_krs" TEXT NOT NULL DEFAULT '',
    "kondisi_pulang" TEXT NOT NULL DEFAULT '',
    "caregiver_nama" TEXT NOT NULL DEFAULT '',
    "caregiver_hubungan" TEXT NOT NULL DEFAULT '',
    "caregiver_kemampuan" TEXT NOT NULL DEFAULT '',
    "kebutuhan_homecare" BOOLEAN NOT NULL DEFAULT false,
    "jenis_homecare" TEXT[],
    "kebutuhan_alat_bantu" BOOLEAN NOT NULL DEFAULT false,
    "alat_bantu" TEXT[],
    "dukungan_keluarga" TEXT NOT NULL DEFAULT '',
    "kepatuhan_obat_sebelumnya" TEXT NOT NULL DEFAULT '',
    "riwayat_readmisi" TEXT NOT NULL DEFAULT '',
    "catatan" TEXT NOT NULL DEFAULT '',
    "pencatat" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discharge_asesmen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discharge_asesmen_kunjungan_id_created_at_idx" ON "medicalrecord"."discharge_asesmen"("kunjungan_id", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."discharge_asesmen"
    ADD CONSTRAINT "discharge_asesmen_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
