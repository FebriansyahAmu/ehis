-- Tambah kolom optimistic-concurrency `version` ke master.pegawai (FLOWS §7).
-- Data-preserving: ADD COLUMN dengan default 0 untuk baris existing.

ALTER TABLE "master"."pegawai" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
