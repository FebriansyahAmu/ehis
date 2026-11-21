// GET by Nomor IHS (Playbook SATUSEHAT · API Catalogue Onboarding):
//   GET /Practitioner/{id} · GET /Patient/{id} → 1 resource (bukan Bundle searchset).
// `lookupByIhs` read-only terhadap data EHIS: TIDAK mengubah peta (ResourceMap) — hanya membaca data
// SatuSehat, menunjukkan data lokal pemilik IHS tsb (bila ada) dan kecocokan dengan data yang dilihat.
// `mapIhsManual` = satu-satunya jalur tulis: petakan manual KHUSUS Sandbox (lihat IhsMapInput).
// Panggilan tercatat di log pengiriman (tertaut ke `localId` bila diberikan). NIK/KK/paspor dimasker.

import "server-only";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import type { FhirResourceBase } from "@/lib/fhir/fhirShared";
import { Errors } from "@/lib/errors/appError";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as consoleDal from "@/lib/dal/fhir/consoleDal";
import * as sourceDal from "@/lib/dal/fhir/onboardingSourceDal";
import * as patientSourceDal from "@/lib/dal/fhir/patientSourceDal";
import type { Actor } from "@/lib/auth/actor";
import type {
  IhsIdentifierDTO, IhsLocalRefDTO, IhsLookupDTO, IhsLookupInput, IhsLookupType, IhsMapDTO, IhsMapInput,
} from "@/lib/schemas/fhir/ihsLookup";
import { fhirRequest } from "./transport";
import { auditActorOf } from "./audit";
import { redactIdentifiers } from "./auditBody";
import { NON_NAKES } from "./onboardingService";

interface FhirPerson extends FhirResourceBase {
  active?: boolean;
  name?: { text?: string; given?: string[]; family?: string; prefix?: string[]; suffix?: string[] }[];
  gender?: string;
  birthDate?: string;
  identifier?: { system?: string; value?: string }[];
  qualification?: { code?: { text?: string; coding?: { code?: string; display?: string }[] } }[];
  meta?: { versionId?: string; lastUpdated?: string };
}

function namaOf(r: FhirPerson): string | null {
  const n = r.name?.[0];
  if (!n) return null;
  if (n.text) return n.text;
  return [n.prefix?.join(" "), n.given?.join(" "), n.family, n.suffix?.join(" ")].filter(Boolean).join(" ") || null;
}

export async function lookupByIhs(input: IhsLookupInput, actor: Actor): Promise<IhsLookupDTO> {
  const cfg = getSatuSehatConfig();
  const { resourceType, ihsId, localId } = input;
  const t0 = Date.now();

  const [res, owner, current] = await Promise.all([
    fhirRequest<FhirPerson>(
      { method: "GET", path: `${resourceType}/${encodeURIComponent(ihsId)}` },
      {
        ...auditActorOf(actor), endpoint: `${resourceType}/{ihs}`, resourceType,
        ...(localId ? { localType: resourceType, localId } : {}),
      },
    ),
    resourceMapDal.findByIhs(cfg.mode, resourceType, ihsId),
    localId ? resourceMapDal.findByLocal(cfg.mode, resourceType, localId) : Promise.resolve(null),
  ]);

  const base = {
    mode: cfg.mode,
    resourceType,
    ihsId,
    durationMs: Date.now() - t0,
    lokal: owner ? await localRef(owner.localType, owner.localId) : null,
    cocok: localId ? (current ? current.ihsId === ihsId : null) : null,
    ihsTerpetakan: current?.ihsId ?? null,
  };

  if (!res.ok) {
    const notFound = res.error.status === 404 || res.error.status === 410;
    return {
      ...base,
      found: false,
      status: String(res.error.status ?? "ERR"),
      message: notFound ? `Nomor IHS ${ihsId} tidak ditemukan sebagai ${resourceType} di SatuSehat` : res.error.message,
      ringkas: null,
      resource: res.error.body ? redactIdentifiers(res.error.body) : null,
    };
  }

  const r = res.value.body;
  if (!r || r.resourceType !== resourceType) {
    return {
      ...base,
      found: false,
      status: String(res.value.status),
      message: `Respons bukan ${resourceType} (${r?.resourceType ?? "kosong"})`,
      ringkas: null,
      resource: r ? redactIdentifiers(r) : null,
    };
  }

  const safe = redactIdentifiers(r) as FhirPerson;
  const identifiers: IhsIdentifierDTO[] = (safe.identifier ?? [])
    .filter((i): i is { system: string; value: string } => !!i.system && !!i.value)
    .map((i) => ({ system: i.system, value: i.value }));

  return {
    ...base,
    found: true,
    status: String(res.value.status),
    message: null,
    ringkas: {
      nama: namaOf(safe),
      gender: safe.gender ?? null,
      birthDate: safe.birthDate ?? null,
      active: typeof safe.active === "boolean" ? safe.active : null,
      identifiers,
      kualifikasi: (safe.qualification ?? [])
        .map((q) => q.code?.text ?? q.code?.coding?.[0]?.display ?? q.code?.coding?.[0]?.code)
        .filter((x): x is string => !!x),
      versionId: safe.meta?.versionId ?? null,
      lastUpdated: safe.meta?.lastUpdated ?? null,
    },
    resource: safe,
  };
}

async function localRef(localType: string, localId: string): Promise<IhsLocalRefDTO> {
  const l = (await consoleDal.labelsFor(localType, [localId])).get(localId);
  return { localId, label: l?.label ?? localId, sub: l?.sub ?? null };
}

// ── Petakan manual (KHUSUS Sandbox) ─────────────────────────
// NIK data asli RS tak terdaftar di Sandbox → Cari IHS (GET by NIK) tak pernah ketemu, padahal resource
// lain (Encounter, Condition, …) butuh referensi Practitioner/Patient valid untuk diuji. Operator memilih
// IHS dummy Sandbox sendiri. Penjaga: mode wajib sandbox (prod ditolak — IHS hanya dari pencocokan NIK) ·
// data lokal harus ada & layak · IHS diverifikasi ada di SatuSehat (GET, tercatat di log pengiriman) ·
// kunci per data (anti dobel klik). Kolom denormalisasi master (Dokter/Pasien) TIDAK disentuh (prod-only).

/** Kunci per data: cegah 2 petakan paralel untuk data yang sama. */
const mapping = new Set<string>();

export async function mapIhsManual(input: IhsMapInput, actor: Actor): Promise<IhsMapDTO> {
  const cfg = getSatuSehatConfig();
  if (cfg.mode !== "sandbox") {
    throw Errors.forbidden("Petakan manual hanya tersedia di mode Sandbox — di produksi IHS didapat dari pencocokan NIK (Cari IHS)");
  }
  const { resourceType, ihsId, localId } = input;
  const key = `${resourceType}|${localId}`;
  if (mapping.has(key)) throw Errors.conflict("Data ini sedang dipetakan — tunggu hingga selesai");
  mapping.add(key);
  try {
    await assertLocalEligible(resourceType, localId);
    const previous = await resourceMapDal.findByLocal(cfg.mode, resourceType, localId);

    let versionId: string | null = null;
    if (previous?.ihsId !== ihsId) {
      const res = await fhirRequest<FhirPerson>(
        { method: "GET", path: `${resourceType}/${encodeURIComponent(ihsId)}` },
        {
          ...auditActorOf(actor), endpoint: `${resourceType}/{ihs} · petakan manual`, resourceType,
          localType: resourceType, localId,
        },
      );
      if (!res.ok) {
        const notFound = res.error.status === 404 || res.error.status === 410;
        throw Errors.validation(notFound
          ? `Nomor IHS ${ihsId} tidak ditemukan sebagai ${resourceType} di SatuSehat Sandbox${res.error.status === 410 ? " (sudah dihapus)" : ""}`
          : `Gagal memverifikasi IHS di SatuSehat: ${res.error.message}`);
      }
      if (res.value.body?.resourceType !== resourceType) {
        throw Errors.validation(`Nomor IHS ${ihsId} bukan ${resourceType} (${res.value.body?.resourceType ?? "respons kosong"})`);
      }
      versionId = res.value.body?.meta?.versionId ?? null;
    }

    const saved = previous?.ihsId === ihsId
      ? previous
      : await resourceMapDal.upsert({ env: cfg.mode, localType: resourceType, localId, resourceType, ihsId, versionId });
    const other = await resourceMapDal.findOtherByIhs(cfg.mode, resourceType, ihsId, localId);
    const [lokal, dipakaiJuga] = await Promise.all([
      localRef(resourceType, localId),
      other ? localRef(other.localType, other.localId) : Promise.resolve(null),
    ]);
    return {
      mode: cfg.mode,
      resourceType,
      ihsId,
      lokal,
      sebelumnya: previous?.ihsId ?? null,
      dipakaiJuga,
      lastSyncAt: saved.lastSyncAt.toISOString(),
    };
  } finally {
    mapping.delete(key);
  }
}

/** Data lokal harus ada & layak dipetakan (nakes ber-profesi kesehatan · pasien bukan hasil merge). */
async function assertLocalEligible(resourceType: IhsLookupType, localId: string): Promise<void> {
  if (resourceType === "Practitioner") {
    const p = await sourceDal.getPractitionerCandidate(localId);
    if (!p) throw Errors.notFound("Pegawai aktif ber-profesi tidak ditemukan");
    if (!p.profesi || NON_NAKES.has(p.profesi)) throw Errors.validation("Bukan tenaga kesehatan — tidak punya Practitioner di SatuSehat");
    return;
  }
  const p = await patientSourceDal.getPatient(localId);
  if (!p) throw Errors.notFound("Pasien tidak ditemukan");
  if (p.mergedIntoId) throw Errors.validation("Pasien ini sudah digabung (merge) — petakan pada rekam survivor");
}
