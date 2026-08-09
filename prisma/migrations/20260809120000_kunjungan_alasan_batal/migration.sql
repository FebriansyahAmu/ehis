-- Batalkan Kunjungan: alasan pembatalan (medico-legal), additive nullable.
-- Kunjungan hanya boleh dibatalkan bila belum ada rekam medis/tindakan/order.
ALTER TABLE "encounter"."kunjungan" ADD COLUMN "alasan_batal" TEXT;
