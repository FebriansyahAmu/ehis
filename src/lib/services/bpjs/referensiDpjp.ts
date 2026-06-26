// Service BPJS V-Claim — sync referensi DPJP/Spesialis + resolver kode DPJP (BWS3).
//
// syncRefSpesialis / syncRefDpjp:
//   • BPJS_MODE=mock (belum ada cons-id) → SEED daftar demo (supaya halaman Mapping bisa diuji).
//     ⚠️ removable — lihat TECH_DEBT.
//   • sandbox/prod → GET referensi BPJS via callBpjs (audited), upsert ke DB.
//
// resolveKodeDpjpBpjs*: dipakai saat build payload (InsertSPRI kodeDokter / SEP skdp.kodeDPJP / dpjpLayan).

import { getBpjsConfig } from "@/lib/bpjs/server/config";
import { callBpjs } from "@/lib/bpjs/server/httpClient";
import {
  RefListResponseSchema,
  refDokterPelayananPath,
  refSpesialistikPath,
  type JenisPelayananParam,
} from "@/lib/schemas/bpjs/referensi";
import * as dpjpDal from "@/lib/dal/bpjs/dpjpDal";
import { auditedCall, type AuditContext } from "./audit";

export interface BpjsAuditActor {
  actor: string;
  actorRole: string;
}

// ── Seed mock (tanpa cons-id) ────────────────────────────────────────────────
const MOCK_SPESIALIS: dpjpDal.RefItem[] = [
  { kode: "BED", nama: "Bedah" },
  { kode: "INT", nama: "Penyakit Dalam" },
  { kode: "ANA", nama: "Anak" },
  { kode: "OBG", nama: "Obstetri & Ginekologi" },
  { kode: "JAN", nama: "Jantung & Pembuluh Darah" },
];
const MOCK_DPJP: dpjpDal.RefDpjpItem[] = [
  { kode: "31486", nama: "Satro Jadhit, dr", kodeSpesialis: "BED" },
  { kode: "31492", nama: "Satroni Lawa, dr", kodeSpesialis: "BED" },
  { kode: "31537", nama: "Budi Santoso, dr, Sp.JP", kodeSpesialis: "JAN" },
  { kode: "31540", nama: "Hendra Wijaya, dr, Sp.PD", kodeSpesialis: "INT" },
  { kode: "31555", nama: "Maya Sari, dr, Sp.A", kodeSpesialis: "ANA" },
  { kode: "31561", nama: "Rina Hartati, dr, Sp.OG", kodeSpesialis: "OBG" },
  { kode: "31692", nama: "dr. Dimas Arya Nugraha, Sp.B", kodeSpesialis: "BED" },
];

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function ctx(endpoint: string, who: BpjsAuditActor): AuditContext {
  return {
    service: "vclaim",
    endpoint,
    method: "GET",
    actor: who.actor,
    actorRole: who.actorRole,
  };
}

/** Referensi pakai SEED mock? true bila mode mock DAN tanpa override BPJS_REFERENSI_LIVE. */
function referensiSeedMock(): boolean {
  const cfg = getBpjsConfig();
  return cfg.mode === "mock" && !cfg.referensiLive;
}

/** Sync referensi spesialistik BPJS → bpjs.RefSpesialis. Return jumlah item. */
export async function syncRefSpesialis(who: BpjsAuditActor): Promise<number> {
  if (referensiSeedMock()) {
    await dpjpDal.upsertRefSpesialis(MOCK_SPESIALIS);
    return MOCK_SPESIALIS.length;
  }
  const path = refSpesialistikPath();
  const res = await auditedCall<unknown>(ctx(path, who), () =>
    callBpjs({ service: "vclaim", method: "GET", path, allowInMock: true }),
  );
  if (!res.ok) throw new Error(`Sync spesialis gagal: ${res.error.type}`);
  const parsed = RefListResponseSchema.parse(
    res.value.response ?? { list: [] },
  );
  await dpjpDal.upsertRefSpesialis(parsed.list);
  return parsed.list.length;
}

/**
 * Sync referensi dokter DPJP → bpjs.RefDpjp. Real: iterasi semua RefSpesialis (pakai tgl + jenis
 * pelayanan). Mock: seed daftar demo. Return total item di-upsert.
 */
export async function syncRefDpjp(
  opts: { jenisPelayanan?: JenisPelayananParam; tgl?: string },
  who: BpjsAuditActor,
): Promise<number> {
  if (referensiSeedMock()) {
    await dpjpDal.upsertRefDpjp(MOCK_DPJP);
    return MOCK_DPJP.length;
  }
  const jp = opts.jenisPelayanan ?? "1";
  const tgl = opts.tgl ?? todayYmd();
  const spesialis = await dpjpDal.listRefSpesialis();
  // Dedup by kode lintas-spesialis (faskes bisa kembalikan dokter sama di banyak spesialis).
  // First-seen menyimpan kodeSpesialis-nya. Hitungan = dokter DISTINCT.
  const seen = new Map<string, dpjpDal.RefDpjpItem>();
  for (const sp of spesialis) {
    const path = refDokterPelayananPath(jp, tgl, sp.kode);
    const res = await auditedCall<unknown>(ctx(path, who), () =>
      callBpjs({ service: "vclaim", method: "GET", path, allowInMock: true }),
    );
    if (!res.ok) continue; // spesialis tanpa dokter / error transien → lanjut
    const parsed = RefListResponseSchema.parse(
      res.value.response ?? { list: [] },
    );
    for (const d of parsed.list) {
      if (!seen.has(d.kode))
        seen.set(d.kode, {
          kode: d.kode,
          nama: d.nama,
          kodeSpesialis: sp.kode,
        });
    }
  }
  const items = [...seen.values()];
  if (items.length) await dpjpDal.upsertRefDpjp(items);
  return items.length;
}

// ── Resolver build-payload ────────────────────────────────────────────────────
/** Kode DPJP BPJS dari dokterId. "" bila belum ter-map. */
export async function resolveKodeDpjpBpjs(
  dokterId: string | null | undefined,
): Promise<string> {
  if (!dokterId) return "";
  return (await dpjpDal.getKodeByDokterId(dokterId)) ?? "";
}

/** Kode DPJP BPJS dari pegawaiId (Pegawai→Dokter→mapping). "" bila belum ter-map. */
export async function resolveKodeDpjpBpjsByPegawai(
  pegawaiId: string | null | undefined,
): Promise<string> {
  if (!pegawaiId) return "";
  return (await dpjpDal.getKodeByPegawaiId(pegawaiId)) ?? "";
}
