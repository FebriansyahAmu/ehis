// FH9b — Konsol Resource & Kunjungan SatuSehat (read-only).
//
// Payload yang ditampilkan TIDAK disimpan (R14: PII klinis tak di-log) — dibangun ulang dari data
// terkini lewat builder yang SAMA dengan job kirim (`previewEncounter` / `previewMaster`), lalu
// dibandingkan hash-nya dengan peta: hash sama = identik dengan yang sudah diterima SatuSehat.

import "server-only";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import { Errors } from "@/lib/errors/appError";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as consoleDal from "@/lib/dal/fhir/consoleDal";
import * as encounterSrc from "@/lib/dal/fhir/encounterSourceDal";
import type { Actor } from "@/lib/auth/actor";
import { auditActorOf } from "./audit";
import { previewEncounter } from "./encounterSyncService";
import { previewMaster } from "./onboardingService";
import type {
  EncounterDetailDTO, EncounterPageDTO, PayloadStatus, ResourceDetailDTO, ResourcePageDTO,
  ResourceRowDTO, ResourceSummaryDTO,
} from "@/lib/schemas/fhir/resources";
import type { KunjunganSyncFilter } from "@/lib/dal/fhir/consoleDal";

type MapRow = NonNullable<Awaited<ReturnType<typeof resourceMapDal.findById>>>;

const iso = (d: Date | null | undefined) => d?.toISOString() ?? null;

// ── Resource ────────────────────────────────────────────────

export async function summary(): Promise<ResourceSummaryDTO> {
  const env = getSatuSehatConfig().mode;
  const types = await resourceMapDal.summaryByResourceType(env);
  return {
    mode: env,
    total: types.reduce((n, t) => n + t.count, 0),
    types: types.map((t) => ({ resourceType: t.resourceType, count: t.count, lastSyncAt: iso(t.lastSyncAt) })),
  };
}

export async function listResources(q: { type: string; q?: string; page: number; pageSize: number }): Promise<ResourcePageDTO> {
  const env = getSatuSehatConfig().mode;
  const { total, rows } = await resourceMapDal.listPage(env, { resourceType: q.type, q: q.q, page: q.page, pageSize: q.pageSize });
  return { total, page: q.page, pageSize: q.pageSize, rows: await toRows(rows) };
}

export async function getResource(id: string, actor: Actor): Promise<ResourceDetailDTO> {
  const row = await resourceMapDal.findById(id);
  if (!row) throw Errors.notFound("Resource tidak ditemukan");
  const [base] = await toRows([row]);
  const p = await payloadOf(row, actor);
  return { ...base, hash: row.hash, ...p };
}

async function payloadOf(row: MapRow, actor: Actor): Promise<Pick<ResourceDetailDTO, "payload" | "payloadStatus" | "payloadNote">> {
  if (row.localType === "Patient" || row.localType === "Practitioner") {
    return {
      payload: null, payloadStatus: null,
      payloadNote: "Resolve-only — RS tidak mengirim resource ini; IHS id diambil dari SatuSehat berdasarkan NIK.",
    };
  }
  if (row.localType === "Organization" || row.localType === "Location") {
    const r = await previewMaster(row.localType, row.localId);
    return { payload: r.resource, payloadStatus: r.status, payloadNote: r.note };
  }
  if (!row.kunjunganId) {
    return {
      payload: null, payloadStatus: null,
      payloadNote: "Kunjungan pemilik belum tertaut (data sebelum konsol ini) — sinkron ulang kunjungannya sekali untuk menautkan.",
    };
  }
  const plan = await previewEncounter(row.kunjunganId, auditActorOf(actor));
  const item = plan.items.find((i) => i.localType === row.localType && i.localId === row.localId);
  if (!item) {
    return {
      payload: null, payloadStatus: null,
      payloadNote: plan.skipReason ?? "Tidak lagi dibangun dari data terkini (data sumber dihapus atau diganti).",
    };
  }
  return { payload: item.resource, payloadStatus: item.status, payloadNote: null };
}

async function toRows(rows: MapRow[]): Promise<ResourceRowDTO[]> {
  const byType = new Map<string, string[]>();
  for (const r of rows) if (!r.kunjunganId) byType.set(r.localType, [...(byType.get(r.localType) ?? []), r.localId]);
  const labels = new Map<string, { label: string; sub?: string }>();
  for (const [type, ids] of byType) {
    for (const [id, l] of await consoleDal.labelsFor(type, ids)) labels.set(`${type}|${id}`, l);
  }
  const kl = await consoleDal.kunjunganLabels([...new Set(rows.flatMap((r) => (r.kunjunganId ? [r.kunjunganId] : [])))]);

  return rows.map((r) => {
    const k = r.kunjunganId ? kl.get(r.kunjunganId) : undefined;
    const l = labels.get(`${r.localType}|${r.localId}`);
    return {
      id: r.id, resourceType: r.resourceType, localType: r.localType, localId: r.localId,
      ihsId: r.ihsId, versionId: r.versionId, lastSyncAt: r.lastSyncAt.toISOString(), kunjunganId: r.kunjunganId,
      label: k ? k.pasienNama : (l?.label ?? null),
      sub: k ? k.noKunjungan : (l?.sub ?? null),
    };
  });
}

// ── Kunjungan ───────────────────────────────────────────────

export async function listEncounters(q: {
  q?: string; unit?: string; sync?: KunjunganSyncFilter; page: number; pageSize: number;
}): Promise<EncounterPageDTO> {
  const env = getSatuSehatConfig().mode;
  const rows = await consoleDal.listKunjunganSync(env, q);
  return {
    total: rows[0]?.total ?? 0,
    page: q.page,
    pageSize: q.pageSize,
    rows: rows.map((r) => ({
      id: r.id, noKunjungan: r.noKunjungan, unit: r.unit, status: r.status,
      waktuKunjungan: r.waktuKunjungan.toISOString(),
      pasienNama: r.pasienNama, noRm: r.noRm,
      encounterIhsId: r.encounterIhsId, lastSyncAt: iso(r.lastSyncAt), resourceCount: r.resourceCount,
      jobStatus: r.jobStatus, jobAt: iso(r.jobAt), jobError: r.jobError,
    })),
  };
}

export async function getEncounter(kunjunganId: string, actor: Actor): Promise<EncounterDetailDTO> {
  const env = getSatuSehatConfig().mode;
  const k = await consoleDal.getKunjunganHeader(kunjunganId);
  if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");

  const [plan, mapped, jobs, patientMap, dokter, ruangan] = await Promise.all([
    previewEncounter(k.id, auditActorOf(actor)),
    resourceMapDal.listByKunjungan(env, k.id),
    consoleDal.listJobsForKunjungan(k.id),
    resourceMapDal.findByLocal(env, "Patient", k.patientId),
    k.dpjpId ? encounterSrc.getDokter(k.dpjpId) : null,
    k.ruanganId ? encounterSrc.getRuangan(k.ruanganId) : null,
  ]);

  const planned = new Set(plan.items.map((i) => `${i.localType}|${i.localId}`));
  const orphans = await toRows(mapped.filter((m) => !planned.has(`${m.localType}|${m.localId}`)));
  const counts: Record<PayloadStatus, number> = { synced: 0, changed: 0, new: 0 };
  for (const i of plan.items) counts[i.status]++;
  const enc = plan.items.find((i) => i.localType === "Encounter")?.ihsId ?? mapped.find((m) => m.localType === "Encounter")?.ihsId ?? null;
  const pd = dokter?.pegawai;

  return {
    mode: env,
    kunjungan: {
      id: k.id, noKunjungan: k.noKunjungan, unit: k.unit, status: k.status,
      waktuKunjungan: k.waktuKunjungan.toISOString(), dilayaniAt: iso(k.dilayaniAt), selesaiAt: iso(k.selesaiAt),
      dpjp: pd ? [pd.gelarDepan, pd.namaLengkap, pd.gelarBelakang].filter(Boolean).join(" ") : null,
      ruangan: ruangan?.nama ?? null,
      pasien: {
        id: k.patientId, nama: k.pasien.nama, noRm: k.pasien.noRm,
        gender: k.pasien.gender ?? null, tanggalLahir: iso(k.pasien.tanggalLahir),
        ihsId: patientMap?.ihsId ?? null,
      },
    },
    encounterIhsId: enc,
    target: plan.target,
    skipReason: plan.skipReason ?? null,
    blockers: plan.blockers,
    infos: plan.infos,
    notes: plan.notes,
    issues: plan.issues,
    resources: plan.items.map((i) => ({
      localType: i.localType, localId: i.localId, resourceType: i.resourceType, status: i.status,
      ihsId: i.ihsId, versionId: i.versionId, lastSyncAt: iso(i.lastSyncAt), payload: i.resource,
    })),
    orphans,
    jobs: jobs.map((j) => ({ ...j, createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString() })),
    counts,
  };
}
