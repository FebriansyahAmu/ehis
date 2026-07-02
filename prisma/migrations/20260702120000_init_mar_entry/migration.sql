-- Rekam Medis — MAR (Medication Administration Record per shift, tab MAR RI, SNARS PKPO 6).
-- mar_entry = pencatatan pemberian obat per (resep_item × tanggal × shift), append-only
-- "latest wins" (koreksi = INSERT baris baru; read ambil created_at terbaru per slot).
-- Baris obat diturunkan dari medicalrecord.resep_item (order non-batal); nama_obat/dosis/rute
-- di-snapshot medikolegal. resep_item_id = soft-ref (tanpa FK). perawat = actor login;
-- HAM wajib perawat2 saat Diberikan (ditegakkan Service). FK → encounter.kunjungan cascade.
-- Gate clinical.keperawatan + ABAC careUnit (route()).

-- CreateTable
CREATE TABLE "medicalrecord"."mar_entry" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "resep_item_id" UUID NOT NULL,
    "nama_obat" TEXT NOT NULL,
    "dosis" TEXT NOT NULL DEFAULT '',
    "rute" TEXT NOT NULL DEFAULT '',
    "tanggal" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "waktu_pemberian" TEXT,
    "perawat" TEXT NOT NULL,
    "perawat2" TEXT NOT NULL DEFAULT '',
    "catatan" TEXT NOT NULL DEFAULT '',
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mar_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mar_entry_kunjungan_id_tanggal_idx" ON "medicalrecord"."mar_entry"("kunjungan_id", "tanggal");

-- AddForeignKey
ALTER TABLE "medicalrecord"."mar_entry"
    ADD CONSTRAINT "mar_entry_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
