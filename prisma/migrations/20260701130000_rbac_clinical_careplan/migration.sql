-- RBAC leaf BARU `clinical.careplan` — Rencana Asuhan Terintegrasi (RAT), tab Rencana Asuhan.
-- Rencana multi-PPA dipimpin DPJP (ketua tim). Resource sendiri agar Dokter+Perawat punya CREATE
-- penuh TANPA membuka clinical.rekammedis shared, dan verify (co-sign) khusus DPJP (ditegakkan
-- Service, bukan permission terpisah). Endpoint /kunjungan/:id/care-plan (+/:masalahId, /goal) di-gate
-- clinical.careplan. ABAC careUnit tetap men-scope per-kunjungan (route() choke-point, clinical.*).
-- Grant: Admin full · Dokter [r,c,u,d] · Perawat [r,c,u,d]. Idempoten (ON CONFLICT DO NOTHING).

-- ── Permissions (4 baris) ──
INSERT INTO "auth"."permissions" ("id","resource","action","kode","nama","modul") VALUES
  (gen_random_uuid(), 'clinical.careplan', 'read',   'clinical.careplan:read',   'Rencana Asuhan — Lihat',  'clinical'),
  (gen_random_uuid(), 'clinical.careplan', 'create', 'clinical.careplan:create', 'Rencana Asuhan — Tambah', 'clinical'),
  (gen_random_uuid(), 'clinical.careplan', 'update', 'clinical.careplan:update', 'Rencana Asuhan — Ubah',   'clinical'),
  (gen_random_uuid(), 'clinical.careplan', 'delete', 'clinical.careplan:delete', 'Rencana Asuhan — Hapus',  'clinical')
ON CONFLICT ("kode") DO NOTHING;

-- ── Role grants (Admin / Dokter / Perawat = full CRUD) ──
INSERT INTO "auth"."role_permissions" ("role_id","permission_id")
SELECT r."id", p."id" FROM "auth"."roles" r
  JOIN "auth"."permissions" p ON p."kode" IN (
    'clinical.careplan:read','clinical.careplan:create','clinical.careplan:update','clinical.careplan:delete')
  WHERE r."key" IN ('Admin','Dokter','Perawat')
ON CONFLICT DO NOTHING;
