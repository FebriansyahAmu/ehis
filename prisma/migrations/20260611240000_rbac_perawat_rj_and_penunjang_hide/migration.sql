-- Fix dua mismatch grant role vs model unit-kerja (careUnit):
--
-- Bug 1 — Menu Rawat Jalan tak muncul untuk Perawat (walau unit kerja mencakup RJ).
--   Nav care butuh DUA syarat: perm (kapabilitas role) + careUnit (unit kerja). Perawat
--   punya clinical.igd + clinical.ri TAPI tak punya clinical.rj → item RJ tersembunyi.
--   Fix: grant Perawat clinical.rj:[read,update] (mirror igd/ri). Dokter sudah punya.
--
-- Bug 2 — Menu penunjang (Farmasi/Lab/Rad) muncul untuk Dokter/Perawat padahal bukan
--   unit kerjanya. Item penunjang di-gate ancillary.* (TANPA careUnit) = milik unit penunjang
--   berdiri-sendiri. Dokter/Perawat keliru di-grant ancillary.*:read → menu muncul.
--   Tab status order di rekam medis TAK perm-gated (klien tak cek ancillary.*), jadi cabut aman.
--   Fix: revoke ancillary.* dari Dokter & Perawat.
--
-- Idempoten (INSERT ON CONFLICT DO NOTHING · DELETE no-op bila sudah tak ada).

-- ── Bug 1: grant Perawat clinical.rj ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN ('clinical.rj:read', 'clinical.rj:update')
  WHERE r."key" = 'Perawat'
ON CONFLICT DO NOTHING;

-- ── Bug 2: revoke ancillary.* dari Dokter & Perawat ──
DELETE FROM "auth"."role_permissions" rp
USING "auth"."roles" r, "auth"."permissions" p
WHERE rp."role_id" = r."id"
  AND rp."permission_id" = p."id"
  AND r."key" IN ('Dokter', 'Perawat')
  AND p."resource" LIKE 'ancillary.%';
