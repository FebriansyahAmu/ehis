-- Sterilisasi RBAC klinis (idempoten, ON CONFLICT DO NOTHING):
-- 1. Dokter & Perawat dapat `registration.kunjungan:read` — petugas klinis perlu MEMBACA
--    kunjungan (rekam medis by kunjunganId, board, roster petugas). Visibilitas MODUL
--    Registration/Antrean dipindah ke gate `registration.pasien` (navigation.ts) sehingga
--    grant ini TIDAK membuka modul registrasi.
-- 2. Dokter & Perawat dapat `clinical.cppt:delete` — hapus dibatasi PEMBUAT catatan
--    (ownership guard di cpptService.remove); Admin (superuser) bebas.

INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('registration.kunjungan:read', 'clinical.cppt:delete')
  WHERE r."key" IN ('Dokter','Perawat')
ON CONFLICT DO NOTHING;
