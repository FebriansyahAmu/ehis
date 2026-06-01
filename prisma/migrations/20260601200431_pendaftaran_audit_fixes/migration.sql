-- AlterTable
ALTER TABLE "pendaftaran"."pasien_alamat" ADD COLUMN     "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL;

-- AlterTable
ALTER TABLE "pendaftaran"."pasien_alergi_awal" ADD COLUMN     "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL;

-- AlterTable
ALTER TABLE "pendaftaran"."pasien_kontak_darurat" ADD COLUMN     "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL;

-- ── DB guarantees (audit fix #2) — di luar model Prisma ──────────────────────
-- enc & hash WAJIB sepasang (cegah enc terisi tapi hash null → dedup bocor).
ALTER TABLE "pendaftaran"."pasien"
  ADD CONSTRAINT "pasien_nik_pair_chk" CHECK (("nik_enc" IS NULL) = ("nik_hash" IS NULL));
ALTER TABLE "pendaftaran"."pasien_penjamin"
  ADD CONSTRAINT "pasien_penjamin_nomor_pair_chk" CHECK (("nomor_enc" IS NULL) = ("nomor_hash" IS NULL));

-- Maksimal 1 penjamin primer aktif per pasien (cegah data korup multi-primer).
CREATE UNIQUE INDEX "pasien_penjamin_one_primer_uq"
  ON "pendaftaran"."pasien_penjamin" ("pasien_id")
  WHERE "is_primer" AND "deleted_at" IS NULL;

