// Konsol Prerequisites (Playbook SATUSEHAT langkah 2–5) — daftar data lokal per resource + detail mentah.
//
// Read-only. Detail menampilkan: data master lokal apa adanya (NIK dimasker), baris peta ResourceMap,
// payload FHIR — Organization/Location dari builder yang SAMA dengan sinkron (previewMaster);
// Practitioner/Patient = representasi profil SATUSEHAT (adapters/identity, TIDAK dikirim — RS hanya
// GET by NIK) — serta request SatuSehat. Payload tidak disimpan (dibangun ulang dari data terkini, R14).

import "server-only";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import { FHIR_SYSTEM } from "@/lib/fhir/fhirShared";
import { decryptPii, maskPii } from "@/lib/crypto/pii";
import { Errors } from "@/lib/errors/appError";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as sourceDal from "@/lib/dal/fhir/onboardingSourceDal";
import * as patientSourceDal from "@/lib/dal/fhir/patientSourceDal";
import { NON_NAKES, previewMaster } from "./onboardingService";
import { toFhirPatientView, toFhirPractitionerView } from "@/lib/fhir/adapters/identity";
import type { FhirResourceBase } from "@/lib/fhir/fhirShared";
import type {
  PrereqItemDetailDTO, PrereqItemDTO, PrereqItemPageDTO, PrereqItemsQuery, PrereqJenis,
} from "@/lib/schemas/fhir/onboarding";

export const PREREQ_RESOURCE: Record<PrereqJenis, string> = {
  organization: "Organization",
  location: "Location",
  practitioner: "Practitioner",
  patient: "Patient",
};

const iso = (d: Date | null | undefined) => d?.toISOString() ?? null;

function nikMasked(enc: string | null | undefined): string | null {
  if (!enc) return null;
  try {
    return maskPii(decryptPii(enc).replace(/\D/g, ""));
  } catch {
    return "(tidak dapat didekripsi)";
  }
}

const namaPegawai = (p: { gelarDepan: string | null; namaLengkap: string; gelarBelakang: string | null }) =>
  [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(" ");

type LocalRow = Omit<PrereqItemDTO, "ihsId" | "lastSyncAt">;

/** Baris lokal Organization/Location/Practitioner (jumlahnya kecil → filter & paginasi di memori). */
async function localRows(jenis: Exclude<PrereqJenis, "patient">): Promise<LocalRow[]> {
  if (jenis === "organization") {
    const orgs = await sourceDal.listOrganizations();
    return orgs.map((o) => ({
      localId: o.id, kode: o.kode, nama: o.nama, aktif: o.active || o.isRoot,
      sub: o.isRoot ? "Induk RS — Organization ID DevHub" : String(o.orgType ?? ""),
    }));
  }
  if (jenis === "location") {
    const [locs, orgs] = await Promise.all([sourceDal.listLocations(), sourceDal.listOrganizations()]);
    const orgNama = new Map(orgs.map((o) => [o.id, o.nama]));
    return locs.map((l) => ({
      localId: l.id, kode: l.kode, nama: l.nama, aktif: l.active,
      sub: [l.locationType, l.kelas, orgNama.get(l.organizationId)].filter(Boolean).join(" · "),
    }));
  }
  const pegawai = await sourceDal.listPractitionerCandidates();
  return pegawai
    .filter((p) => p.profesi && !NON_NAKES.has(p.profesi))
    .map((p) => ({
      localId: p.id, kode: p.nip, nama: namaPegawai(p), aktif: true,
      sub: [p.profesi, p.nikEnc ? null : "tanpa NIK"].filter(Boolean).join(" · "),
    }));
}

export async function listItems(jenis: PrereqJenis, q: PrereqItemsQuery): Promise<PrereqItemPageDTO> {
  const env = getSatuSehatConfig().mode;

  if (jenis === "patient") {
    const { total, rows } = await patientSourceDal.listForPrereq(env, q);
    return {
      jenis, total, page: q.page, pageSize: q.pageSize,
      rows: rows.map((r) => ({
        localId: r.id, kode: r.no_rm, nama: r.nama, aktif: true,
        sub: !r.ada_nik ? "tanpa NIK" : r.is_anonim ? "anonim" : r.is_wna ? "WNA" : "ber-NIK",
        ihsId: r.ihs_id, lastSyncAt: iso(r.last_sync_at),
      })),
    };
  }

  const [all, maps] = await Promise.all([localRows(jenis), resourceMapDal.listByType(env, PREREQ_RESOURCE[jenis])]);
  const byLocal = new Map(maps.map((m) => [m.localId, m]));
  const term = q.q?.toLowerCase();
  const rows = all
    .map((r) => {
      const m = byLocal.get(r.localId);
      return { ...r, ihsId: m?.ihsId ?? null, lastSyncAt: iso(m?.lastSyncAt) };
    })
    .filter((r) => !term || [r.kode, r.nama, r.sub ?? ""].some((v) => v.toLowerCase().includes(term)))
    .filter((r) => q.status === "semua" || (q.status === "terpetakan" ? r.ihsId : !r.ihsId));

  const start = (q.page - 1) * q.pageSize;
  return { jenis, total: rows.length, page: q.page, pageSize: q.pageSize, rows: rows.slice(start, start + q.pageSize) };
}

export async function getItem(jenis: PrereqJenis, localId: string): Promise<PrereqItemDetailDTO> {
  const env = getSatuSehatConfig().mode;
  const resourceType = PREREQ_RESOURCE[jenis];
  const m = await resourceMapDal.findByLocal(env, resourceType, localId);
  const map = m
    ? { id: m.id, ihsId: m.ihsId, versionId: m.versionId, hash: m.hash, lastSyncAt: m.lastSyncAt.toISOString() }
    : null;
  const base = { jenis, resourceType, localId, map };

  if (jenis === "organization" || jenis === "location") {
    // Pratinjau sekaligus mengembalikan baris lokal (PK lookup) — tak memuat master 2×.
    const preview = await previewMaster(resourceType as "Organization" | "Location", localId);
    const local = preview.local;
    if (!local) throw Errors.notFound(`${resourceType} lokal tidak ditemukan`);
    const isRoot = "isRoot" in local && local.isRoot;
    return {
      ...base,
      kode: local.kode,
      nama: local.nama,
      local: { ...local },
      payload: preview.resource,
      payloadStatus: preview.status,
      payloadNote: preview.note,
      request: isRoot ? null : map ? { method: "PUT", path: `${resourceType}/${map.ihsId}` } : { method: "POST", path: resourceType },
    };
  }

  if (jenis === "practitioner") {
    const p = await sourceDal.getPractitionerCandidate(localId);
    if (!p) throw Errors.notFound("Pegawai lokal tidak ditemukan");
    const nik = nikMasked(p.nikEnc);
    return {
      ...base,
      kode: p.nip,
      nama: namaPegawai(p),
      local: {
        nip: p.nip, gelarDepan: p.gelarDepan, namaLengkap: p.namaLengkap, gelarBelakang: p.gelarBelakang,
        jenisKelamin: p.jenisKelamin, tanggalLahir: iso(p.tanggalLahir)?.slice(0, 10) ?? null,
        profesi: p.profesi, nik, dokter: p.dokter,
      },
      payload: toFhirPractitionerView({ ...p, nik }, { ihsId: map?.ihsId }),
      payloadStatus: null,
      payloadNote: GET_ONLY_NOTE.Practitioner,
      request: nik ? { method: "GET", path: `Practitioner?identifier=${FHIR_SYSTEM.nik}|${nik}` } : null,
    };
  }

  const p = await patientSourceDal.getPatient(localId);
  if (!p) throw Errors.notFound("Pasien tidak ditemukan");
  const nik = nikMasked(p.nikEnc);
  return {
    ...base,
    kode: p.noRm,
    nama: p.nama,
    local: {
      noRm: p.noRm, nama: p.nama, gender: p.gender, tempatLahir: p.tempatLahir,
      tanggalLahir: iso(p.tanggalLahir)?.slice(0, 10) ?? null,
      nik, isAnonim: p.isAnonim, isWna: p.isWna, mergedIntoId: p.mergedIntoId, idSatusehat: p.idSatusehat,
    },
    payload: toFhirPatientView({ ...p, nik }, { ihsId: map?.ihsId }),
    payloadStatus: null,
    payloadNote: nik
      ? GET_ONLY_NOTE.Patient
      : "Tanpa NIK — belum bisa dicari (jalur pasien tanpa NIK/anonim/WNA belum didukung). Payload di bawah tanpa identifier NIK.",
    request: nik ? { method: "GET", path: `Patient?identifier=${FHIR_SYSTEM.nik}|${nik}` } : null,
  };
}

const GET_ONLY_NOTE = {
  Practitioner:
    "Representasi FHIR dari data pegawai (profil SATUSEHAT) — TIDAK dikirim: RS hanya GET by NIK; data resmi Practitioner milik SDMK.",
  Patient:
    "Representasi FHIR dari data pasien (profil SATUSEHAT) — TIDAK dikirim: RS hanya GET by NIK; data resmi Patient milik SatuSehat (Dukcapil/MPI).",
} as const;

/**
 * Representasi FHIR Patient/Practitioner untuk konsol Resource (peta yang sudah ada). NIK dimasker.
 * Null bila data lokal sudah tidak ada.
 */
export async function identityView(
  localType: "Patient" | "Practitioner",
  localId: string,
  ihsId: string,
): Promise<{ resource: FhirResourceBase | null; note: string }> {
  if (localType === "Patient") {
    const p = await patientSourceDal.getPatient(localId);
    return {
      resource: p ? toFhirPatientView({ ...p, nik: nikMasked(p.nikEnc) }, { ihsId }) : null,
      note: p ? GET_ONLY_NOTE.Patient : "Data pasien lokal tidak ditemukan / sudah dihapus",
    };
  }
  const p = await sourceDal.getPractitionerCandidate(localId);
  return {
    resource: p ? toFhirPractitionerView({ ...p, nik: nikMasked(p.nikEnc) }, { ihsId }) : null,
    note: p ? GET_ONLY_NOTE.Practitioner : "Data pegawai lokal tidak ditemukan / nonaktif",
  };
}
