-- Tambah role "Analis" (Analis/ATLM Laboratorium) — petugas bench lab (padanan Radiografer di rad):
-- terima order, ambil/registrasi sampel, entry hasil, lapor nilai kritis. Validasi/sign-off TETAP
-- milik SpPK (ancillary.lab.validate tidak diberikan ke Analis). Grant: ancillary.lab.worklist[r/u] +
-- ancillary.lab.critical[r/c]. Idempoten (ON CONFLICT DO NOTHING). unit_scoped=true (selaras Radiografer;
-- careUnit ABAC efektif di-bypass via isAncillaryActor karena permission murni ancillary.*).

-- Role
INSERT INTO "auth"."roles" ("id", "key", "nama", "deskripsi", "unit_scoped", "is_active", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'Analis', 'Analis Laboratorium', 'Pemrosesan sampel & entry hasil lab', true, true, now(), now())
ON CONFLICT ("key") DO NOTHING;

-- Grants
INSERT INTO "auth"."role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'ancillary.lab.worklist:read', 'ancillary.lab.worklist:update',
    'ancillary.lab.critical:read', 'ancillary.lab.critical:create'
  )
  WHERE r."key" = 'Analis'
ON CONFLICT DO NOTHING;
