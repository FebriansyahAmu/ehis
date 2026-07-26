-- AlterTable: paket layanan terpilih saat pendaftaran (RJ) — soft-ref master.paket_layanan.
ALTER TABLE "encounter"."kunjungan" ADD COLUMN "paket_layanan_id" UUID;
