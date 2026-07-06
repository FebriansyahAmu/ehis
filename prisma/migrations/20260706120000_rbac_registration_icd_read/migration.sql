-- Registrasi butuh cari kode ICD-10 saat mengisi rujukan SEP (Kontrol Pasca Ranap: diagnosa
-- primer episode ranap + tambah manual). Permission master.icd:read sudah di-seed di
-- 20260611200000 (semula hanya Admin/Dokter/Perawat). Tambahkan grant read ke role Registrasi.
-- Ini BUKAN akses modul Master (gate modul = master.view; Registrasi tak punya) — hanya lookup ICD.

INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" = 'master.icd:read'
  WHERE r."key" = 'Registrasi'
ON CONFLICT DO NOTHING;
