-- AlterTable
ALTER TABLE "pendaftaran"."pasien" ADD COLUMN     "is_wna" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "no_paspor_enc" TEXT,
ADD COLUMN     "no_paspor_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pasien_no_paspor_hash_key" ON "pendaftaran"."pasien"("no_paspor_hash");

-- ── DB guarantees (WNA) — di luar model Prisma ───────────────────────────────
-- paspor enc & hash WAJIB sepasang.
ALTER TABLE "pendaftaran"."pasien"
  ADD CONSTRAINT "pasien_paspor_pair_chk" CHECK (("no_paspor_enc" IS NULL) = ("no_paspor_hash" IS NULL));

-- Identitas inti: pasien non-anonim WAJIB punya NIK ATAU paspor (Mr.X dikecualikan).
ALTER TABLE "pendaftaran"."pasien"
  ADD CONSTRAINT "pasien_identitas_chk"
  CHECK ("is_anonim" OR "nik_hash" IS NOT NULL OR "no_paspor_hash" IS NOT NULL);

