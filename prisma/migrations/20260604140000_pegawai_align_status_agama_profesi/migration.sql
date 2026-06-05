-- Selaraskan kontrak master.Pegawai dengan form "Tambah Pengguna" (2026-06-04).
-- (1) Enum StatusPegawai: PNS/PPPK/Kontrak/Honorer/Magang/Mitra → ASN/Outsourcing/Honorer/Magang/Mitra.
--     Data-preserving: PNS|PPPK → ASN, Kontrak → Outsourcing (sisanya tetap).
-- (2) Tambah kolom `agama` (identitas) + `profesi` (jenis tenaga; sumber kebenaran Dokter/Perawat/…).

-- ── (1) Enum rename + remap nilai (tanpa kehilangan baris) ──────────────────────
ALTER TYPE "master"."StatusPegawai" RENAME TO "StatusPegawai_old";

CREATE TYPE "master"."StatusPegawai" AS ENUM ('ASN', 'Outsourcing', 'Honorer', 'Magang', 'Mitra');

ALTER TABLE "master"."pegawai"
  ALTER COLUMN "status_pegawai" TYPE "master"."StatusPegawai"
  USING (
    CASE "status_pegawai"::text
      WHEN 'PNS'     THEN 'ASN'
      WHEN 'PPPK'    THEN 'ASN'
      WHEN 'Kontrak' THEN 'Outsourcing'
      ELSE "status_pegawai"::text
    END::"master"."StatusPegawai"
  );

DROP TYPE "master"."StatusPegawai_old";

-- ── (2) Kolom baru ──────────────────────────────────────────────────────────────
ALTER TABLE "master"."pegawai" ADD COLUMN "agama" TEXT;
ALTER TABLE "master"."pegawai" ADD COLUMN "profesi" TEXT;
