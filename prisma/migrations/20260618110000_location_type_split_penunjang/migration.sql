-- LocationType enum (schema "master"): pecah "Penunjang" → Laboratorium + Radiologi.
-- Additive: tambah 2 value baru (Penunjang TETAP ada — PG enum tak bisa drop value; ditandai
-- DEPRECATED & dibuang dari pilihan dropdown FE). Lalu migrasi baris Location lama by-name.
-- ADD VALUE harus commit dulu sebelum dipakai di UPDATE → apply script jalankan bertahap.

ALTER TYPE "master"."LocationType" ADD VALUE IF NOT EXISTS 'Laboratorium';
ALTER TYPE "master"."LocationType" ADD VALUE IF NOT EXISTS 'Radiologi';

-- Migrasi data (fase terpisah, setelah enum commit):
UPDATE "master"."location" SET "location_type" = 'Laboratorium'
  WHERE "location_type" = 'Penunjang' AND "nama" ILIKE '%lab%';
UPDATE "master"."location" SET "location_type" = 'Radiologi'
  WHERE "location_type" = 'Penunjang' AND ("nama" ILIKE '%rad%' OR "nama" ILIKE '%rontgen%' OR "nama" ILIKE '%imaging%' OR "nama" ILIKE '%usg%');
