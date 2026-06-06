-- Encounter / Kunjungan — tambah kolom `ruangan_id` (ruangan layanan).
-- IGD: bay/zona triase; RJ: poli-room. Placeholder UUID (selaras dpjp_id/bed_id) — dipilih
-- dari master Ruangan saat pendaftaran. Aditif murni (nullable, tanpa FK constraint).
-- Acuan: docs/BACKEND-ENCOUNTER.md · prisma/schema/encounter.prisma.

-- AlterTable
ALTER TABLE "encounter"."kunjungan" ADD COLUMN "ruangan_id" UUID;

-- CreateIndex
CREATE INDEX "kunjungan_ruangan_id_idx" ON "encounter"."kunjungan"("ruangan_id");
