/**
 * Audit Trail Mock Data (BP8.1).
 * 35 entries lintas V-Claim + Aplicares — spread realistis endpoint,
 * actor, durasi, error mix. Sorted newest-first.
 */

import type { BPJSAuditEntry } from "../bpjsShared";
import { logAuditEntry } from "../auditStore";

// Deterministic pseudo-hash (djb2 → hex ×8 → 64 chars)
function ph(seed: string): string {
  let n = 5381;
  for (let i = 0; i < seed.length; i++) n = ((n << 5) + n) ^ seed.charCodeAt(i);
  const h = (n >>> 0).toString(16).padStart(8, "0");
  return h.repeat(8);
}

const CONS_ID = "12345";

type RawEntry = Omit<BPJSAuditEntry, "requestHash" | "responseHash"> & { _seed: string };

function make(e: RawEntry): BPJSAuditEntry {
  const { _seed, ...rest } = e;
  return {
    ...rest,
    requestHash: ph(_seed + "req"),
    ...(e.success ? { responseHash: ph(_seed + "res") } : {}),
  };
}

let _seeded = false;

export function seedAuditTrailMock(): void {
  if (_seeded) return;
  _seeded = true;
  [...AUDIT_TRAIL_MOCK].reverse().forEach((e) => logAuditEntry(e));
}

export const AUDIT_TRAIL_MOCK: BPJSAuditEntry[] = [
  // ── 2026-05-30 (Today) ────────────────────────────────────
  make({
    _seed: "001", id: "audit-001",
    timestamp: "2026-05-30T08:12:34.000Z",
    endpoint: "/Peserta/nokartu/{noKartu}/tglSEP/{tgl}",
    method: "GET", responseCode: "200", success: true, durationMs: 312,
    actor: "dr. Budi Santoso, Sp.JP", actorRole: "DPJP", consId: CONS_ID,
  }),
  make({
    _seed: "002", id: "audit-002",
    timestamp: "2026-05-30T08:14:02.000Z",
    endpoint: "/SEP/2.0/insert",
    method: "POST", responseCode: "200", success: true, durationMs: 587,
    actor: "dr. Budi Santoso, Sp.JP", actorRole: "DPJP", consId: CONS_ID,
    idempotencyKey: "0001234567890-2026-05-30-a1b2c3",
  }),
  make({
    _seed: "003", id: "audit-003",
    timestamp: "2026-05-30T08:35:11.000Z",
    endpoint: "/Rujukan/2.0/noKartu/{noKartu}/tglMulai/{tgl}/tglAkhir/{tgl2}",
    method: "GET", responseCode: "201", success: false, durationMs: 445,
    actor: "Siti Rahma, A.Md.Kep", actorRole: "Perawat", consId: CONS_ID,
    errorType: "DATA_NOT_FOUND",
  }),
  make({
    _seed: "004", id: "audit-004",
    timestamp: "2026-05-30T09:01:55.000Z",
    endpoint: "/Aplicares/bed/list",
    method: "GET", responseCode: "200", success: true, durationMs: 220,
    actor: "System Auto-sync", actorRole: "System", consId: CONS_ID,
  }),
  make({
    _seed: "005", id: "audit-005",
    timestamp: "2026-05-30T09:22:40.000Z",
    endpoint: "/RencanaKontrol/v2/insert",
    method: "POST", responseCode: "200", success: true, durationMs: 631,
    actor: "dr. Hendra Wijaya, Sp.EM", actorRole: "DPJP", consId: CONS_ID,
    idempotencyKey: "0009876543210-2026-05-30-d4e5f6",
  }),
  make({
    _seed: "006", id: "audit-006",
    timestamp: "2026-05-30T09:45:18.000Z",
    endpoint: "/SEP/{noSEP}",
    method: "GET", responseCode: "200", success: true, durationMs: 198,
    actor: "Admin BPJS RS", actorRole: "Admin", consId: CONS_ID,
  }),
  make({
    _seed: "007", id: "audit-007",
    timestamp: "2026-05-30T10:03:27.000Z",
    endpoint: "/Monitoring/Kunjungan/tglMulai/{tgl}/tglAkhir/{tgl2}/jnsPelayanan/{jns}",
    method: "GET", responseCode: "200", success: true, durationMs: 410,
    actor: "Admin BPJS RS", actorRole: "Admin", consId: CONS_ID,
  }),
  make({
    _seed: "008", id: "audit-008",
    timestamp: "2026-05-30T10:15:44.000Z",
    endpoint: "/SEP/2.0/update",
    method: "PUT", responseCode: "500", success: false, durationMs: 5002,
    actor: "dr. Budi Santoso, Sp.JP", actorRole: "DPJP", consId: CONS_ID,
    errorType: "TIMEOUT", retryCount: 0,
    idempotencyKey: "0001234567890-2026-05-30-b7c8d9",
  }),
  make({
    _seed: "009", id: "audit-009",
    timestamp: "2026-05-30T10:18:01.000Z",
    endpoint: "/SEP/2.0/update",
    method: "PUT", responseCode: "200", success: true, durationMs: 472,
    actor: "dr. Budi Santoso, Sp.JP", actorRole: "DPJP", consId: CONS_ID,
    idempotencyKey: "0001234567890-2026-05-30-b7c8d9",
    retryCount: 1,
  }),
  make({
    _seed: "010", id: "audit-010",
    timestamp: "2026-05-30T11:00:09.000Z",
    endpoint: "/Aplicares/bed/update",
    method: "PUT", responseCode: "200", success: true, durationMs: 344,
    actor: "Admin BPJS RS", actorRole: "Admin", consId: CONS_ID,
    idempotencyKey: "KAMAR-VIP-2026-05-30-x9y0z1",
  }),
  // ── 2026-05-29 ────────────────────────────────────────────
  make({
    _seed: "011", id: "audit-011",
    timestamp: "2026-05-29T07:55:22.000Z",
    endpoint: "/Peserta/nik/{nik}/tglSEP/{tgl}",
    method: "GET", responseCode: "200", success: true, durationMs: 287,
    actor: "Siti Rahma, A.Md.Kep", actorRole: "Perawat", consId: CONS_ID,
  }),
  make({
    _seed: "012", id: "audit-012",
    timestamp: "2026-05-29T08:20:44.000Z",
    endpoint: "/SEP/2.0/insert",
    method: "POST", responseCode: "202", success: false, durationMs: 390,
    actor: "dr. Hendra Wijaya, Sp.EM", actorRole: "DPJP", consId: CONS_ID,
    errorType: "DUPLICATE",
    idempotencyKey: "0009876543210-2026-05-29-m1n2o3",
  }),
  make({
    _seed: "013", id: "audit-013",
    timestamp: "2026-05-29T08:45:13.000Z",
    endpoint: "/SEP/2.0/insert",
    method: "POST", responseCode: "200", success: true, durationMs: 541,
    actor: "dr. Hendra Wijaya, Sp.EM", actorRole: "DPJP", consId: CONS_ID,
    idempotencyKey: "0009876543210-2026-05-29-m1n2o3",
    retryCount: 1,
  }),
  make({
    _seed: "014", id: "audit-014",
    timestamp: "2026-05-29T09:12:08.000Z",
    endpoint: "/RencanaKontrol/v2/update",
    method: "PUT", responseCode: "204", success: false, durationMs: 330,
    actor: "dr. Budi Santoso, Sp.JP", actorRole: "DPJP", consId: CONS_ID,
    errorType: "VALIDATION_ERR",
  }),
  make({
    _seed: "015", id: "audit-015",
    timestamp: "2026-05-29T10:02:55.000Z",
    endpoint: "/Monitoring/Klaim/tglPulang/{tgl}/jnsPelayanan/{jns}/status/{status}",
    method: "GET", responseCode: "200", success: true, durationMs: 502,
    actor: "Admin BPJS RS", actorRole: "Admin", consId: CONS_ID,
  }),
  make({
    _seed: "016", id: "audit-016",
    timestamp: "2026-05-29T10:30:41.000Z",
    endpoint: "/Rujukan/2.0/insert",
    method: "POST", responseCode: "200", success: true, durationMs: 618,
    actor: "dr. Budi Santoso, Sp.JP", actorRole: "DPJP", consId: CONS_ID,
    idempotencyKey: "0001234567890-2026-05-29-p4q5r6",
  }),
  make({
    _seed: "017", id: "audit-017",
    timestamp: "2026-05-29T11:15:33.000Z",
    endpoint: "/SEP/2.0/internal/get/{noSEP}",
    method: "GET", responseCode: "200", success: true, durationMs: 175,
    actor: "Febri Kasir", actorRole: "Kasir", consId: CONS_ID,
  }),
  make({
    _seed: "018", id: "audit-018",
    timestamp: "2026-05-29T13:44:09.000Z",
    endpoint: "/Aplicares/bed/list",
    method: "GET", responseCode: "503", success: false, durationMs: 10001,
    actor: "System Auto-sync", actorRole: "System", consId: CONS_ID,
    errorType: "TIMEOUT",
  }),
  make({
    _seed: "019", id: "audit-019",
    timestamp: "2026-05-29T14:02:15.000Z",
    endpoint: "/Aplicares/bed/list",
    method: "GET", responseCode: "200", success: true, durationMs: 388,
    actor: "System Auto-sync", actorRole: "System", consId: CONS_ID,
    retryCount: 1,
  }),
  make({
    _seed: "020", id: "audit-020",
    timestamp: "2026-05-29T15:30:00.000Z",
    endpoint: "/RencanaKontrol/SPRI/insert",
    method: "POST", responseCode: "200", success: true, durationMs: 443,
    actor: "dr. Hendra Wijaya, Sp.EM", actorRole: "DPJP", consId: CONS_ID,
    idempotencyKey: "0009876543210-2026-05-29-s7t8u9",
  }),
  // ── 2026-05-28 ────────────────────────────────────────────
  make({
    _seed: "021", id: "audit-021",
    timestamp: "2026-05-28T08:02:11.000Z",
    endpoint: "/SEP/2.0/delete/{noSEP}",
    method: "DELETE", responseCode: "200", success: true, durationMs: 290,
    actor: "Admin BPJS RS", actorRole: "Admin", consId: CONS_ID,
    idempotencyKey: "SEP-DEL-0001111222333-2026-05-28",
  }),
  make({
    _seed: "022", id: "audit-022",
    timestamp: "2026-05-28T09:00:00.000Z",
    endpoint: "/Peserta/nokartu/{noKartu}/tglSEP/{tgl}",
    method: "GET", responseCode: "203", success: false, durationMs: 310,
    actor: "Siti Rahma, A.Md.Kep", actorRole: "Perawat", consId: CONS_ID,
    errorType: "ELIGIBILITY_EXPIRED",
  }),
  make({
    _seed: "023", id: "audit-023",
    timestamp: "2026-05-28T10:22:44.000Z",
    endpoint: "/Monitoring/HistoriPelayanan/peserta/{noKartu}/tglMulai/{tgl}/tglAkhir/{tgl2}",
    method: "GET", responseCode: "200", success: true, durationMs: 650,
    actor: "Admin BPJS RS", actorRole: "Admin", consId: CONS_ID,
  }),
  make({
    _seed: "024", id: "audit-024",
    timestamp: "2026-05-28T11:05:37.000Z",
    endpoint: "/Aplicares/bed/maintenance",
    method: "POST", responseCode: "200", success: true, durationMs: 422,
    actor: "Admin BPJS RS", actorRole: "Admin", consId: CONS_ID,
    idempotencyKey: "MAINT-VIP-0005555666777-2026-05-28",
  }),
  make({
    _seed: "025", id: "audit-025",
    timestamp: "2026-05-28T13:50:28.000Z",
    endpoint: "/SEP/2.0/update",
    method: "PUT", responseCode: "200", success: true, durationMs: 510,
    actor: "dr. Budi Santoso, Sp.JP", actorRole: "DPJP", consId: CONS_ID,
    idempotencyKey: "0001234567890-2026-05-28-v1w2x3",
  }),
  // ── 2026-05-27 ────────────────────────────────────────────
  make({
    _seed: "026", id: "audit-026",
    timestamp: "2026-05-27T07:34:12.000Z",
    endpoint: "/Rujukan/{noRujukan}",
    method: "GET", responseCode: "200", success: true, durationMs: 255,
    actor: "Siti Rahma, A.Md.Kep", actorRole: "Perawat", consId: CONS_ID,
  }),
  make({
    _seed: "027", id: "audit-027",
    timestamp: "2026-05-27T09:11:19.000Z",
    endpoint: "/RencanaKontrol/delete/{noSurat}",
    method: "DELETE", responseCode: "500", success: false, durationMs: 8001,
    actor: "Admin BPJS RS", actorRole: "Admin", consId: CONS_ID,
    errorType: "SERVER_500",
    idempotencyKey: "RK-DEL-0009876543210-2026-05-27",
  }),
  make({
    _seed: "028", id: "audit-028",
    timestamp: "2026-05-27T09:15:44.000Z",
    endpoint: "/RencanaKontrol/delete/{noSurat}",
    method: "DELETE", responseCode: "200", success: true, durationMs: 340,
    actor: "Admin BPJS RS", actorRole: "Admin", consId: CONS_ID,
    idempotencyKey: "RK-DEL-0009876543210-2026-05-27",
    retryCount: 1,
  }),
  make({
    _seed: "029", id: "audit-029",
    timestamp: "2026-05-27T10:40:55.000Z",
    endpoint: "/SEP/2.0/insert",
    method: "POST", responseCode: "200", success: true, durationMs: 598,
    actor: "dr. Hendra Wijaya, Sp.EM", actorRole: "DPJP", consId: CONS_ID,
    idempotencyKey: "0009876543210-2026-05-27-y4z5a6",
  }),
  make({
    _seed: "030", id: "audit-030",
    timestamp: "2026-05-27T14:20:33.000Z",
    endpoint: "/Monitoring/JasaRaharja/jnsPelayanan/{jns}/tglMulai/{tgl}/tglAkhir/{tgl2}",
    method: "GET", responseCode: "200", success: true, durationMs: 720,
    actor: "Admin BPJS RS", actorRole: "Admin", consId: CONS_ID,
  }),
  // ── 2026-05-26 ────────────────────────────────────────────
  make({
    _seed: "031", id: "audit-031",
    timestamp: "2026-05-26T08:05:44.000Z",
    endpoint: "/Aplicares/bed/list",
    method: "GET", responseCode: "200", success: true, durationMs: 299,
    actor: "System Auto-sync", actorRole: "System", consId: CONS_ID,
  }),
  make({
    _seed: "032", id: "audit-032",
    timestamp: "2026-05-26T09:22:11.000Z",
    endpoint: "/SEP/2.0/insert",
    method: "POST", responseCode: "200", success: true, durationMs: 555,
    actor: "dr. Budi Santoso, Sp.JP", actorRole: "DPJP", consId: CONS_ID,
    idempotencyKey: "0001234567890-2026-05-26-b7c8d9",
  }),
  make({
    _seed: "033", id: "audit-033",
    timestamp: "2026-05-26T10:45:03.000Z",
    endpoint: "/Peserta/nokartu/{noKartu}/tglSEP/{tgl}",
    method: "GET", responseCode: "200", success: true, durationMs: 321,
    actor: "Febri Kasir", actorRole: "Kasir", consId: CONS_ID,
  }),
  make({
    _seed: "034", id: "audit-034",
    timestamp: "2026-05-26T11:30:21.000Z",
    endpoint: "/RencanaKontrol/v2/insert",
    method: "POST", responseCode: "204", success: false, durationMs: 380,
    actor: "dr. Budi Santoso, Sp.JP", actorRole: "DPJP", consId: CONS_ID,
    errorType: "VALIDATION_ERR",
    idempotencyKey: "0001234567890-2026-05-26-e1f2g3",
  }),
  make({
    _seed: "035", id: "audit-035",
    timestamp: "2026-05-26T14:01:59.000Z",
    endpoint: "/Rujukan/2.0/insert",
    method: "POST", responseCode: "200", success: true, durationMs: 490,
    actor: "dr. Hendra Wijaya, Sp.EM", actorRole: "DPJP", consId: CONS_ID,
    idempotencyKey: "0009876543210-2026-05-26-h4i5j6",
  }),
].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
