-- CPPT: hapus catatan = soft-delete (entered-in-error, jejak medico-legal).
-- + RBAC: permission baru clinical.cppt:delete — grant default HANYA Admin
--   (Dokter/Perawat tetap read/create/update; atur ulang via Mapping Hub).

ALTER TABLE "medicalrecord"."cppt" ADD COLUMN "deleted_at" TIMESTAMPTZ(3);

INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.cppt', 'delete', 'clinical.cppt:delete', 'CPPT (SOAP) — Hapus', 'clinical')
ON CONFLICT ("kode") DO NOTHING;

INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" = 'clinical.cppt:delete'
  WHERE r."key" = 'Admin'
ON CONFLICT DO NOTHING;
