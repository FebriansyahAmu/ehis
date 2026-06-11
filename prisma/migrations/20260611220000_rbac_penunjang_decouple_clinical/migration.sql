-- Decouple unit PENUNJANG (Lab/Rad) dari modul rekam medis RI/RJ.
-- Radiografer/SpPK/SpRad adalah unit berdiri-sendiri: aksesnya MURNI lewat ancillary.*
-- (worklist + ekspertise) — bukan clinical.ri/clinical.rj (yang = modul rekam medis
-- Rawat Inap / Rawat Jalan, beda unit & beda ABAC). Grant clinical.ri/rj pada role ini
-- hanya memunculkan menu RI/RJ kosong di EHIS Care (board kosong → 403 di rekam medis),
-- jadi noise. Konteks klinis order sudah denormal di worklist masing-masing.
--
-- Idempoten: DELETE no-op bila grant sudah tak ada (mis. sudah dicabut di Mapping Hub).
-- Sumber kebenaran runtime = auth.role_permissions (Mapping Hub); ini koreksi default.

DELETE FROM "auth"."role_permissions" rp
USING "auth"."roles" r, "auth"."permissions" p
WHERE rp."role_id" = r."id"
  AND rp."permission_id" = p."id"
  AND r."key" IN ('Radiografer', 'SpPK', 'SpRad')
  AND p."kode" IN ('clinical.ri:read', 'clinical.rj:read');
