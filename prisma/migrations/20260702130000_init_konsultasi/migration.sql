-- Rekam Medis — Konsultasi antar-SMF (tab Konsultasi IGD/RI/RJ + worklist konsultan Rawat Jalan).
-- konsultasi = closed-loop SBAR (SNARS SKP 2): Terkirim → Diterima (stamp konsultan) → Dijawab
-- (jawaban + auto-CPPT ke kunjungan asal) → Selesai (konfirmasi read-back DPJP peminta).
-- Batal = soft-delete hanya saat Terkirim. Nama aktor server-otoritatif. FK → encounter.kunjungan
-- cascade. Gate RBAC leaf BARU `clinical.konsultasi` (di-seed di bawah): endpoint nested
-- /kunjungan/:id/konsultasi kena ABAC careUnit; worklist /konsultasi scopeKunjungan:false
-- (konsultan lintas unit — pola ancillary worklist).

-- CreateTable
CREATE TABLE "medicalrecord"."konsultasi" (
    "id" UUID NOT NULL,
    "kunjungan_id" UUID NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'Rutin',
    "status" TEXT NOT NULL DEFAULT 'Terkirim',
    "smf_id" TEXT NOT NULL,
    "smf_nama" TEXT NOT NULL,
    "smf_singkatan" TEXT NOT NULL,
    "dokter_konsultan" TEXT,
    "situation" TEXT NOT NULL,
    "background" TEXT NOT NULL DEFAULT '',
    "assessment" TEXT NOT NULL DEFAULT '',
    "recommendation" TEXT NOT NULL,
    "dokter_peminta" TEXT NOT NULL,
    "author_user_id" UUID,
    "author_pegawai_id" UUID,
    "diterima_at" TIMESTAMPTZ(3),
    "diterima_oleh" TEXT,
    "dijawab_at" TIMESTAMPTZ(3),
    "konsultan_nama" TEXT,
    "konsultan_user_id" UUID,
    "konsultan_pegawai_id" UUID,
    "jawaban_asesmen" TEXT NOT NULL DEFAULT '',
    "jawaban_rekomendasi" TEXT NOT NULL DEFAULT '',
    "jawaban_tindak_lanjut" TEXT NOT NULL DEFAULT '',
    "jawaban_follow_up" TEXT,
    "selesai_at" TIMESTAMPTZ(3),
    "selesai_oleh" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "konsultasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "konsultasi_kunjungan_id_idx" ON "medicalrecord"."konsultasi"("kunjungan_id");

-- CreateIndex
CREATE INDEX "konsultasi_status_created_at_idx" ON "medicalrecord"."konsultasi"("status", "created_at");

-- AddForeignKey
ALTER TABLE "medicalrecord"."konsultasi"
    ADD CONSTRAINT "konsultasi_kunjungan_id_fkey"
    FOREIGN KEY ("kunjungan_id") REFERENCES "encounter"."kunjungan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── RBAC leaf BARU `clinical.konsultasi` ──
-- Konsultasi antar-dokter: Dokter full CRUD (buat/terima/jawab/selesai/batal) · Perawat READ
-- (pantau status, tidak membuat — konsultasi = tindakan medis dokter) · Admin full.
-- Idempoten (ON CONFLICT DO NOTHING).

INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.konsultasi', 'read',   'clinical.konsultasi:read',   'Konsultasi — Lihat',  'clinical'),
  (gen_random_uuid(), 'clinical.konsultasi', 'create', 'clinical.konsultasi:create', 'Konsultasi — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.konsultasi', 'update', 'clinical.konsultasi:update', 'Konsultasi — Ubah',   'clinical'),
  (gen_random_uuid(), 'clinical.konsultasi', 'delete', 'clinical.konsultasi:delete', 'Konsultasi — Hapus',  'clinical')
ON CONFLICT ("kode") DO NOTHING;

INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.konsultasi:read','clinical.konsultasi:create','clinical.konsultasi:update','clinical.konsultasi:delete')
  WHERE r."key" IN ('Admin','Dokter')
ON CONFLICT DO NOTHING;

INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" = 'clinical.konsultasi:read'
  WHERE r."key" = 'Perawat'
ON CONFLICT DO NOTHING;
