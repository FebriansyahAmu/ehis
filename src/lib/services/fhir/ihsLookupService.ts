// GET by Nomor IHS (Playbook SATUSEHAT · API Catalogue Onboarding):
//   GET /Practitioner/{id} · GET /Patient/{id} → 1 resource (bukan Bundle searchset).
// Read-only terhadap data EHIS: TIDAK mengubah peta (ResourceMap) — hanya membaca data SatuSehat,
// menunjukkan data lokal pemilik IHS tsb (bila ada) dan kecocokan dengan data yang sedang dilihat.
// Panggilan tercatat di log pengiriman (tertaut ke `localId` bila diberikan). NIK/KK/paspor dimasker.

import "server-only";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import type { FhirResourceBase } from "@/lib/fhir/fhirShared";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as consoleDal from "@/lib/dal/fhir/consoleDal";
import type { Actor } from "@/lib/auth/actor";
import type { IhsIdentifierDTO, IhsLookupDTO, IhsLookupInput } from "@/lib/schemas/fhir/ihsLookup";
import { fhirRequest } from "./transport";
import { auditActorOf } from "./audit";
import { redactIdentifiers } from "./auditBody";

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

  const label = owner ? (await consoleDal.labelsFor(owner.localType, [owner.localId])).get(owner.localId) : undefined;
  const base = {
    mode: cfg.mode,
    resourceType,
    ihsId,
    durationMs: Date.now() - t0,
    lokal: owner ? { localId: owner.localId, label: label?.label ?? owner.localId, sub: label?.sub ?? null } : null,
    cocok: localId ? (current ? current.ihsId === ihsId : null) : null,
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
