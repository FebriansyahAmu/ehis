-- Edukasi Pasien & Keluarga: tambah soft-delete (hapus catatan = entered-in-error,
-- baris tetap utuh untuk jejak medico-legal). Read DAL filter deleted_at IS NULL.

ALTER TABLE "medicalrecord"."asesmen_edukasi_pasien" ADD COLUMN "deleted_at" TIMESTAMPTZ(3);
