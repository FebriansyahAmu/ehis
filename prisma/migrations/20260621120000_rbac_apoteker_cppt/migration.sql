-- RBAC: Apoteker = peserta CPPT terintegrasi (SNARS PKPO — apoteker mendokumentasikan
-- intervensi farmasi di CPPT pasien). Grant clinical.cppt:{read,create,delete} (idempoten).
--   • read/create: muat thread + tambah catatan.
--   • delete: dibatasi PEMBUAT catatan (ownership guard di cpptService.remove); Admin bebas.
--   • TANPA update: apoteker tak boleh edit catatan / verifikasi co-sign DPJP (clinical.cppt:update).
-- Akses lintas-unit (farmasi melayani IGD/RI/RJ) ditegakkan di isAncillaryActor (careUnit.ts),
-- BUKAN lewat careUnit ABAC. Permission clinical.cppt:* sudah ada (Dokter/Perawat) → cukup grant.

INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('clinical.cppt:read', 'clinical.cppt:create', 'clinical.cppt:delete')
  WHERE r."key" = 'Apoteker'
ON CONFLICT DO NOTHING;
