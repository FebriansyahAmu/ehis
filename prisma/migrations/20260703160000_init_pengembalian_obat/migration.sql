-- Rekam Medis — Pengembalian Obat pasien pulang (tab Pasien Pulang RI, sub Kembalian Obat;
-- PMK 72/2016 Ps. 20). pengembalian_obat = 1 dokumen per sumber resep + item[] snapshot
-- (derivasi resep_item). Workflow: Draft (perawat isi/koreksi) → Diverifikasi (APOTEKER
-- verifikasi fisik — ditegakkan Service, stamp sekali). perawat_penyerah/apoteker_penerima =
-- actor login. FK → encounter.kunjungan cascade; item cascade ke header.
-- RBAC BARU `clinical.pengembalian` (seed di bawah). Stok masuk depo = Inventory (fase later).

-- CreateTable
CREATE TABLE "medicalrecord"."pengembalian_obat" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "resep_order_id" UUID,
    "no_resep_ref" TEXT NOT NULL DEFAULT '',
    "tanggal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "catatan" TEXT NOT NULL DEFAULT '',
    "perawat_penyerah" TEXT NOT NULL,
    "apoteker_penerima" TEXT NOT NULL DEFAULT '',
    "verified_at" TIMESTAMPTZ(3),
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pengembalian_obat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalrecord"."pengembalian_obat_item" (
    "id" UUID NOT NULL,
    "pengembalian_id" UUID NOT NULL,
    "resep_item_id" UUID,
    "nama_obat" TEXT NOT NULL,
    "satuan" TEXT NOT NULL DEFAULT 'Unit',
    "is_ham" BOOLEAN NOT NULL DEFAULT false,
    "is_nar_psi" BOOLEAN NOT NULL DEFAULT false,
    "jumlah_dispensasi" INTEGER NOT NULL DEFAULT 0,
    "jumlah_diberikan" INTEGER NOT NULL DEFAULT 0,
    "jumlah_kembalikan" INTEGER NOT NULL DEFAULT 0,
    "kondisi" TEXT NOT NULL DEFAULT 'Baik',
    "alasan" TEXT NOT NULL DEFAULT 'Pasien Pulang',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengembalian_obat_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pengembalian_obat_kunjungan_id_deleted_at_idx" ON "medicalrecord"."pengembalian_obat"("kunjungan_id", "deleted_at");
CREATE INDEX "pengembalian_obat_item_pengembalian_id_idx" ON "medicalrecord"."pengembalian_obat_item"("pengembalian_id");

-- AddForeignKey
ALTER TABLE "medicalrecord"."pengembalian_obat"
    ADD CONSTRAINT "pengembalian_obat_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "medicalrecord"."pengembalian_obat_item"
    ADD CONSTRAINT "pengembalian_obat_item_pengembalian_id_fkey"
    FOREIGN KEY ("pengembalian_id") REFERENCES "medicalrecord"."pengembalian_obat"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── RBAC leaf BARU `clinical.pengembalian` ──
-- Segitiga aktor: Dokter/Perawat read+create+update (penyerah, isi & koreksi Draft) ·
-- Apoteker read+update (verifikasi penerimaan — refinement "harus Apoteker" di Service;
-- lolos careUnit ABAC via isAncillaryActor) · Admin full. Idempoten.

INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.pengembalian', 'read',   'clinical.pengembalian:read',   'Pengembalian Obat — Lihat',  'clinical'),
  (gen_random_uuid(), 'clinical.pengembalian', 'create', 'clinical.pengembalian:create', 'Pengembalian Obat — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.pengembalian', 'update', 'clinical.pengembalian:update', 'Pengembalian Obat — Ubah',   'clinical'),
  (gen_random_uuid(), 'clinical.pengembalian', 'delete', 'clinical.pengembalian:delete', 'Pengembalian Obat — Hapus',  'clinical')
ON CONFLICT ("kode") DO NOTHING;

INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.pengembalian:read','clinical.pengembalian:create','clinical.pengembalian:update','clinical.pengembalian:delete')
  WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;

INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.pengembalian:read','clinical.pengembalian:create','clinical.pengembalian:update')
  WHERE r."key" IN ('Dokter','Perawat')
ON CONFLICT DO NOTHING;

INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.pengembalian:read','clinical.pengembalian:update')
  WHERE r."key" = 'Apoteker'
ON CONFLICT DO NOTHING;
