-- Penetapan penjaminan JKK oleh BPJS TK via e-PLKK (bukan CoB; PMK 141/2018).
-- RS melapor; BPJS TK menetapkan: menunggu | dijamin | ditolak (→ fallback JKN).
-- Additive nullable — anti drift. Lihat docs/KECELAKAAN-KERJA-JKK.md.

ALTER TABLE "encounter"."kecelakaan"
  ADD COLUMN "status_penjaminan_kk" TEXT,
  ADD COLUMN "no_jaminan_kk"        TEXT;
