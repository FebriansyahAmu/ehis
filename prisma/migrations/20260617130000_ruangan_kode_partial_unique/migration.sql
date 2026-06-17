-- FIX soft-delete: kode Unit/Ruangan/Bed unik HANYA antar baris HIDUP.
-- Sebelumnya `organization_kode_key` / `location_kode_key` / `bed_kode_key` = full unique
-- → baris ter-soft-delete tetap memegang kode-nya, sehingga re-create kode yang sama
-- (FE genKode = max(kode hidup)+1, tak tahu baris terhapus) ditolak 409 "Data Sudah Ada".
-- Ganti ke partial unique (WHERE deleted_at IS NULL) — selaras sdki_kode_alive_key /
-- enum_entry_group_kode_uq. Gap kode bisa di-reuse oleh baris baru (kode = posisional, bukan registry).

DROP INDEX "master"."organization_kode_key";
DROP INDEX "master"."location_kode_key";
DROP INDEX "master"."bed_kode_key";

CREATE UNIQUE INDEX "organization_kode_alive_key" ON "master"."organization"("kode") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "location_kode_alive_key" ON "master"."location"("kode") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "bed_kode_alive_key" ON "master"."bed"("kode") WHERE "deleted_at" IS NULL;
