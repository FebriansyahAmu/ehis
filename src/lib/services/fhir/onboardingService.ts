// FH1 — Onboarding SatuSehat: Organization (sub-unit) · Location (ruangan) · Practitioner (nakes).
//
// Prinsip (docs/FHIR-RULES.md R8/R15):
// - Resolve-first: cek ResourceMap(env) → belum ada → SEARCH by identifier → ketemu = petakan,
//   tidak ada = POST. Sudah terpetakan & payload berubah (hash) → PUT; sama → unchanged (0 panggilan).
// - Practitioner GET-only (RS tak membuat nakes): resolve IHS by NIK, tidak pernah POST.
// - Root RS tak dikirim: dipetakan langsung ke SATUSEHAT_ORG_ID (sudah terdaftar via DevHub).
// - Aksi admin sinkron (bukan bagian tx klinis) → panggil langsung, tanpa outbox. Gagal per item
//   dikumpulkan; item lain tetap diproses.

import "server-only";
import { createHash } from "node:crypto";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import { FHIR_SYSTEM, orgIdentifierSystem, type Bundle, type FhirResourceBase, type SatuSehatMode } from "@/lib/fhir/fhirShared";
import { toFhirOrganization } from "@/lib/fhir/adapters/organization";
import { toFhirLocation } from "@/lib/fhir/adapters/location";
import type { LocalAddress } from "@/lib/fhir/adapters/address";
import { decryptPii } from "@/lib/crypto/pii";
import { Errors } from "@/lib/errors/appError";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import * as sourceDal from "@/lib/dal/fhir/onboardingSourceDal";
import { fhirRequest } from "./transport";
import { auditActorOf } from "./audit";
import type { Actor } from "@/lib/auth/actor";
import type {
  OnboardingJenis, OnboardingItemResult, OnboardingItemSendDTO, OnboardingOutcome, OnboardingRunDTO,
  OnboardingSummaryDTO, PrereqJenis,
} from "@/lib/schemas/fhir/onboarding";
import type { PayloadStatus } from "@/lib/schemas/fhir/resources";
import type { PatientIhsDTO } from "@/lib/schemas/fhir/patient";
import * as patientSourceDal from "@/lib/dal/fhir/patientSourceDal";
import { resolveForPatient } from "./patientIhsService";

/** Profesi non-nakes — tidak punya Practitioner di SatuSehat. */
export const NON_NAKES = new Set(["Administrator", "Non-Tenaga Kesehatan"]);

const LOCAL_TYPE: Record<OnboardingJenis, string> = {
  organization: "Organization",
  location: "Location",
  practitioner: "Practitioner",
};

/** Cegah 2 run paralel per jenis di proses ini (dobel klik / 2 operator). */
const running = new Set<OnboardingJenis>();

type Ctx = {
  env: SatuSehatMode;
  orgId: string;
  audit: ReturnType<typeof auditActorOf>;
};

const hashOf = (r: unknown) => createHash("sha256").update(JSON.stringify(r)).digest("hex");

// ── Entry point ─────────────────────────────────────────────

export async function run(jenis: OnboardingJenis, actor: Actor, opts: { force?: boolean } = {}): Promise<OnboardingRunDTO> {
  if (running.has(jenis)) throw Errors.conflict(`Sinkronisasi ${jenis} sedang berjalan — tunggu hingga selesai`);
  running.add(jenis);
  const t0 = Date.now();
  try {
    const cfg = getSatuSehatConfig();
    const ctx: Ctx = { env: cfg.mode, orgId: cfg.orgId, audit: auditActorOf(actor) };
    const items =
      jenis === "organization" ? await syncOrganizations(ctx)
      : jenis === "location" ? await syncLocations(ctx)
      : await syncPractitioners(ctx, !!opts.force);

    const counts: Record<OnboardingOutcome, number> = { created: 0, updated: 0, resolved: 0, unchanged: 0, skipped: 0, failed: 0 };
    for (const i of items) counts[i.outcome]++;
    return {
      jenis,
      mode: cfg.mode,
      total: items.length,
      counts,
      items: items.filter((i) => i.outcome !== "unchanged"),
      durationMs: Date.now() - t0,
    };
  } finally {
    running.delete(jenis);
  }
}

// ── Kirim 1 item (konsol Prerequisites) ─────────────────────
// Logika SAMA dengan sinkron massal (resolve-first → POST / PUT bila berubah; GET-only untuk nakes &
// pasien), hanya untuk satu data. Prasyarat induk tidak dikirim otomatis: bila unit induk / unit
// pengelola belum terpetakan → gagal dengan petunjuk (kirim induk dulu), bukan mengirim berantai diam-diam.

/** Kunci per item: cegah dobel klik → 2 POST paralel untuk data yang sama. */
const sendingItems = new Set<string>();

export async function sendItem(
  jenis: PrereqJenis,
  localId: string,
  actor: Actor,
  opts: { force?: boolean } = {},
): Promise<OnboardingItemSendDTO> {
  if (jenis !== "patient" && running.has(jenis)) {
    throw Errors.conflict(`Sinkron ${jenis} massal sedang berjalan — tunggu hingga selesai`);
  }
  const key = `${jenis}|${localId}`;
  if (sendingItems.has(key)) throw Errors.conflict("Item ini sedang dikirim — tunggu hingga selesai");
  sendingItems.add(key);
  const t0 = Date.now();
  try {
    const cfg = getSatuSehatConfig();
    const ctx: Ctx = { env: cfg.mode, orgId: cfg.orgId, audit: auditActorOf(actor) };
    const force = !!opts.force;
    const item =
      jenis === "organization" ? await sendOrganization(ctx, localId, force)
      : jenis === "location" ? await sendLocation(ctx, localId, force)
      : jenis === "practitioner" ? await sendPractitioner(ctx, localId, force)
      : await sendPatient(localId, actor, force);
    return { jenis, mode: cfg.mode, item, durationMs: Date.now() - t0 };
  } finally {
    sendingItems.delete(key);
  }
}

async function sendOrganization(ctx: Ctx, localId: string, force: boolean): Promise<OnboardingItemResult> {
  const o = await sourceDal.getOrganization(localId);
  if (!o) throw Errors.notFound("Unit lokal tidak ditemukan / sudah dihapus");
  const base = { localId: o.id, kode: o.kode, nama: o.nama };
  const existing = await resourceMapDal.findByLocal(ctx.env, "Organization", o.id);

  if (o.isRoot) {
    if (existing?.ihsId === ctx.orgId) return { ...base, outcome: "unchanged", ihsId: ctx.orgId, message: "Root RS sudah dipetakan ke SATUSEHAT_ORG_ID" };
    await resourceMapDal.upsert({ env: ctx.env, localType: "Organization", localId: o.id, resourceType: "Organization", ihsId: ctx.orgId });
    return { ...base, outcome: "resolved", ihsId: ctx.orgId, message: "Root RS dipetakan ke SATUSEHAT_ORG_ID (terdaftar via DevHub) — tanpa panggilan" };
  }

  const parent = o.parentId ? await sourceDal.getOrganization(o.parentId) : null;
  const partOfIhsId = !parent || parent.isRoot
    ? ctx.orgId
    : (await resourceMapDal.findByLocal(ctx.env, "Organization", parent.id))?.ihsId;
  if (!partOfIhsId) {
    return { ...base, outcome: "failed", message: `Unit induk "${parent?.nama}" belum terpetakan — kirim unit induk dulu` };
  }

  const r = await upsertResource(ctx, {
    localType: "Organization",
    localId: o.id,
    active: o.active,
    resource: toFhirOrganization(o, { orgId: ctx.orgId, partOfIhsId }),
    existing: existing ?? undefined,
    searchPath: `Organization?partof=${encodeURIComponent(partOfIhsId)}`,
    searchEndpoint: "Organization?partof={ihs}",
    matches: (x) => hasIdentifier(x, orgIdentifierSystem("organization", ctx.orgId), o.kode),
    force,
  });
  return { ...base, ...r };
}

async function sendLocation(ctx: Ctx, localId: string, force: boolean): Promise<OnboardingItemResult> {
  const l = await sourceDal.getLocation(localId);
  if (!l) throw Errors.notFound("Ruangan lokal tidak ditemukan / sudah dihapus");
  const base = { localId: l.id, kode: l.kode, nama: l.nama };
  const [org, orgMap, existing] = await Promise.all([
    sourceDal.getOrganization(l.organizationId),
    resourceMapDal.findByLocal(ctx.env, "Organization", l.organizationId),
    resourceMapDal.findByLocal(ctx.env, "Location", l.id),
  ]);
  const managingOrgIhsId = orgMap?.ihsId ?? (org?.isRoot ? ctx.orgId : undefined);
  if (!managingOrgIhsId) {
    return { ...base, outcome: "failed", message: `Unit "${org?.nama ?? "?"}" belum terpetakan — kirim Organization unitnya dulu` };
  }

  const system = orgIdentifierSystem("location", ctx.orgId);
  const r = await upsertResource(ctx, {
    localType: "Location",
    localId: l.id,
    active: l.active,
    resource: toFhirLocation(l, {
      orgId: ctx.orgId,
      managingOrgIhsId,
      parentAddress: org ?? {},
      parentGps: org ? { lat: org.gpsLat, lng: org.gpsLng } : undefined,
    }),
    existing: existing ?? undefined,
    searchPath: `Location?identifier=${encodeURIComponent(`${system}|${l.kode}`)}`,
    searchEndpoint: "Location?identifier={system}|{kode}",
    matches: (x) => hasIdentifier(x, system, l.kode),
    force,
  });
  return { ...base, ...r };
}

async function sendPractitioner(ctx: Ctx, localId: string, force: boolean): Promise<OnboardingItemResult> {
  const p = await sourceDal.getPractitionerCandidate(localId);
  if (!p) throw Errors.notFound("Pegawai aktif ber-profesi tidak ditemukan");
  if (!p.profesi || NON_NAKES.has(p.profesi)) {
    return { localId: p.id, kode: p.nip, nama: p.namaLengkap, outcome: "skipped", message: "Bukan tenaga kesehatan — tidak punya Practitioner di SatuSehat" };
  }
  const known = await resourceMapDal.findByLocal(ctx.env, "Practitioner", p.id);
  return resolvePractitioner(ctx, p, known ?? undefined, force);
}

const PATIENT_OUTCOME: Record<PatientIhsDTO["status"], OnboardingItemResult["outcome"]> = {
  cached: "unchanged", resolved: "resolved", not_found: "failed", no_nik: "skipped", failed: "failed",
};

async function sendPatient(localId: string, actor: Actor, force: boolean): Promise<OnboardingItemResult> {
  const r = await resolveForPatient(localId, actor, { force });
  const p = await patientSourceDal.getPatient(localId);
  return {
    localId,
    kode: r.noRm,
    nama: p?.nama ?? r.noRm,
    outcome: PATIENT_OUTCOME[r.status],
    ...(r.ihsId ? { ihsId: r.ihsId } : {}),
    message: r.message ?? (r.status === "cached" ? "Sudah terpetakan — tidak dicari ulang" : undefined),
  };
}

// ── Organization ────────────────────────────────────────────

async function syncOrganizations(ctx: Ctx): Promise<OnboardingItemResult[]> {
  const orgs = await sourceDal.listOrganizations();
  const byId = new Map(orgs.map((o) => [o.id, o]));
  const ihsOf = new Map<string, string>(); // orgId lokal → IHS id (env aktif)
  const out: OnboardingItemResult[] = [];

  // Root RS → SATUSEHAT_ORG_ID (tanpa panggilan).
  for (const o of orgs.filter((x) => x.isRoot)) {
    await resourceMapDal.upsert({ env: ctx.env, localType: "Organization", localId: o.id, resourceType: "Organization", ihsId: ctx.orgId });
    ihsOf.set(o.id, ctx.orgId);
  }

  const existing = new Map((await resourceMapDal.listByType(ctx.env, "Organization")).map((m) => [m.localId, m]));
  const depth = (id: string, guard = 0): number => {
    const p = byId.get(id)?.parentId;
    return p && byId.has(p) && guard < 50 ? 1 + depth(p, guard + 1) : 0;
  };
  const ordered = orgs.filter((o) => !o.isRoot).sort((a, b) => depth(a.id) - depth(b.id));

  for (const o of ordered) {
    const base = { localId: o.id, kode: o.kode, nama: o.nama };
    const parent = o.parentId ? byId.get(o.parentId) : undefined;
    const partOfIhsId = parent ? ihsOf.get(parent.id) : ctx.orgId;
    if (!partOfIhsId) {
      out.push({ ...base, outcome: "failed", message: `Induk "${parent?.nama ?? o.parentId}" belum terpetakan ke SatuSehat` });
      continue;
    }

    const resource = toFhirOrganization(o, { orgId: ctx.orgId, partOfIhsId });
    const r = await upsertResource(ctx, {
      localType: "Organization",
      localId: o.id,
      active: o.active,
      resource,
      existing: existing.get(o.id),
      searchPath: `Organization?partof=${encodeURIComponent(partOfIhsId)}`,
      searchEndpoint: "Organization?partof={ihs}",
      matches: (r) => hasIdentifier(r, orgIdentifierSystem("organization", ctx.orgId), o.kode),
    });
    if (r.ihsId) ihsOf.set(o.id, r.ihsId);
    out.push({ ...base, ...r });
  }
  return out;
}

// ── Location ────────────────────────────────────────────────

async function syncLocations(ctx: Ctx): Promise<OnboardingItemResult[]> {
  const [locs, orgs, orgMaps, locMaps] = await Promise.all([
    sourceDal.listLocations(),
    sourceDal.listOrganizations(),
    resourceMapDal.listByType(ctx.env, "Organization"),
    resourceMapDal.listByType(ctx.env, "Location"),
  ]);
  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const orgIhs = new Map(orgMaps.map((m) => [m.localId, m.ihsId]));
  const existing = new Map(locMaps.map((m) => [m.localId, m]));
  const system = orgIdentifierSystem("location", ctx.orgId);
  const out: OnboardingItemResult[] = [];

  for (const l of locs) {
    const base = { localId: l.id, kode: l.kode, nama: l.nama };
    const org = orgById.get(l.organizationId);
    const managingOrgIhsId = orgIhs.get(l.organizationId) ?? (org?.isRoot ? ctx.orgId : undefined);
    if (!managingOrgIhsId) {
      out.push({ ...base, outcome: "failed", message: `Unit "${org?.nama ?? "?"}" belum terpetakan — jalankan sinkron Organization dulu` });
      continue;
    }

    const parentAddress: LocalAddress = org ?? {};
    const resource = toFhirLocation(l, {
      orgId: ctx.orgId,
      managingOrgIhsId,
      parentAddress,
      parentGps: org ? { lat: org.gpsLat, lng: org.gpsLng } : undefined,
    });
    const r = await upsertResource(ctx, {
      localType: "Location",
      localId: l.id,
      active: l.active,
      resource,
      existing: existing.get(l.id),
      searchPath: `Location?identifier=${encodeURIComponent(`${system}|${l.kode}`)}`,
      searchEndpoint: "Location?identifier={system}|{kode}",
      matches: (r) => hasIdentifier(r, system, l.kode),
    });
    out.push({ ...base, ...r });
  }
  return out;
}

// ── Practitioner (GET-only) ─────────────────────────────────

async function syncPractitioners(ctx: Ctx, force: boolean): Promise<OnboardingItemResult[]> {
  const [pegawai, maps] = await Promise.all([
    sourceDal.listPractitionerCandidates(),
    resourceMapDal.listByType(ctx.env, "Practitioner"),
  ]);
  const existing = new Map(maps.map((m) => [m.localId, m]));
  const out: OnboardingItemResult[] = [];

  for (const p of pegawai) {
    if (!p.profesi || NON_NAKES.has(p.profesi)) continue;
    out.push(await resolvePractitioner(ctx, p, existing.get(p.id), force));
  }
  return out;
}

type PractitionerRow = NonNullable<Awaited<ReturnType<typeof sourceDal.getPractitionerCandidate>>>;

/** Resolve IHS 1 nakes by NIK (GET-only). Dipakai sinkron massal & kirim per item. */
async function resolvePractitioner(
  ctx: Ctx,
  p: PractitionerRow,
  known: { ihsId: string } | undefined,
  force: boolean,
): Promise<OnboardingItemResult> {
  const nama = [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(" ");
  const base = { localId: p.id, kode: p.nip, nama };
  if (known && !force) return { ...base, outcome: "unchanged", ihsId: known.ihsId, message: "Sudah terpetakan — tidak dicari ulang" };

  let nik: string;
  try {
    nik = decryptPii(p.nikEnc).replace(/\D/g, "");
  } catch {
    return { ...base, outcome: "failed", message: "NIK tidak dapat didekripsi" };
  }
  if (nik.length !== 16) return { ...base, outcome: "failed", message: "NIK pegawai tidak valid (harus 16 digit)" };

  const res = await fhirRequest<Bundle>(
    { method: "GET", path: `Practitioner?identifier=${encodeURIComponent(`${FHIR_SYSTEM.nik}|${nik}`)}` },
    { ...ctx.audit, endpoint: "Practitioner?identifier={nik}", resourceType: "Practitioner", nik, localType: "Practitioner", localId: p.id },
  );
  if (!res.ok) return { ...base, outcome: "failed", message: res.error.message };
  // 1 NIK seharusnya = 1 nakes (Master Nakes Index). >1 hasil → JANGAN ambil entry[0] diam-diam
  // (bisa salah orang); peta lama dibiarkan. Sandbox bersama berisi duplikat → pakai Petakan manual.
  const ids = [...new Set((res.value.body?.entry ?? []).flatMap((e) =>
    e.resource?.resourceType === "Practitioner" && e.resource.id ? [e.resource.id] : []))];
  if (ids.length > 1) {
    return {
      ...base,
      outcome: "failed",
      message: `NIK cocok dengan ${ids.length} nakes di SatuSehat — tidak dipetakan otomatis.${ctx.env === "sandbox" ? " Di Sandbox: tab Data SatuSehat → Petakan ke data ini." : " Laporkan duplikat ke helpdesk SATUSEHAT."}`,
    };
  }
  const ihsId = ids[0];
  if (!ihsId) return { ...base, outcome: "failed", message: "NIK tidak terdaftar sebagai nakes di SatuSehat (cek SISDMK/KKI)" };

  await resourceMapDal.upsert({ env: ctx.env, localType: "Practitioner", localId: p.id, resourceType: "Practitioner", ihsId });
  // Kolom denormalisasi master Dokter hanya diisi id PRODUKSI (id sandbox/mock tak berlaku di prod).
  if (ctx.env === "prod" && p.dokter && p.dokter.ihsPractitionerId !== ihsId) {
    await sourceDal.setDokterIhsPractitionerId(p.dokter.id, ihsId);
  }
  return { ...base, outcome: known ? (known.ihsId === ihsId ? "unchanged" : "updated") : "resolved", ihsId };
}

// ── Primitif resolve-first + create/PUT (Organization/Location) ──

interface UpsertArgs {
  localType: "Organization" | "Location";
  localId: string;
  active: boolean;
  resource: FhirResourceBase;
  existing?: { ihsId: string; hash: string | null };
  /** Path pencarian resolve-first (dipakai bila belum ada di ResourceMap). */
  searchPath: string;
  /** Template endpoint untuk audit (tanpa nilai). */
  searchEndpoint: string;
  matches: (r: FhirResourceBase) => boolean;
  /** Kirim per item "Kirim ulang": PUT walau payload identik (uji/penyelarasan manual). */
  force?: boolean;
}

async function upsertResource(ctx: Ctx, a: UpsertArgs): Promise<Pick<OnboardingItemResult, "outcome" | "ihsId" | "message">> {
  const hash = hashOf(a.resource);
  const type = a.localType;
  const link = { localType: type, localId: a.localId };

  // 1) Sudah terpetakan → PUT bila berubah.
  if (a.existing) {
    if (a.existing.hash === hash && !a.force) {
      return { outcome: "unchanged", ihsId: a.existing.ihsId, message: "Payload identik dengan yang diterima SatuSehat — tidak dikirim" };
    }
    const res = await fhirRequest(
      { method: "PUT", path: `${type}/${a.existing.ihsId}`, body: { ...a.resource, id: a.existing.ihsId } },
      { ...ctx.audit, ...link, endpoint: `${type}/{id}`, resourceType: type },
    );
    if (!res.ok) return { outcome: "failed", ihsId: a.existing.ihsId, message: res.error.message };
    await save(ctx, a, a.existing.ihsId, hash, versionOf(res.value.body));
    return { outcome: "updated", ihsId: a.existing.ihsId };
  }

  // Nonaktif & belum pernah terkirim → tak perlu didaftarkan.
  if (!a.active) return { outcome: "skipped", message: "Nonaktif & belum terdaftar di SatuSehat" };

  // 2) Resolve-first: cari by identifier.
  const found = await fhirRequest<Bundle>(
    { method: "GET", path: a.searchPath },
    { ...ctx.audit, ...link, endpoint: a.searchEndpoint, resourceType: type },
  );
  if (!found.ok) return { outcome: "failed", message: found.error.message };
  const match = found.value.body?.entry?.map((e) => e.resource).find((r): r is FhirResourceBase => !!r && a.matches(r));
  if (match?.id) {
    // Hash null → run berikutnya akan PUT agar data SatuSehat selaras master lokal.
    await save(ctx, a, match.id, null, match.meta?.versionId ?? null);
    return { outcome: "resolved", ihsId: match.id, message: "Sudah terdaftar — dipetakan (diselaraskan pada sinkron berikutnya)" };
  }

  // 3) Belum ada → create.
  const created = await fhirRequest<FhirResourceBase>(
    { method: "POST", path: type, body: a.resource },
    { ...ctx.audit, ...link, endpoint: type, resourceType: type },
  );
  if (!created.ok) return { outcome: "failed", message: created.error.message };
  const ihsId = created.value.body?.id;
  if (!ihsId) return { outcome: "failed", message: "Respons SatuSehat tanpa id" };
  await save(ctx, a, ihsId, hash, versionOf(created.value.body));
  return { outcome: "created", ihsId };
}

function save(ctx: Ctx, a: UpsertArgs, ihsId: string, hash: string | null, versionId: string | null) {
  return resourceMapDal.upsert({ env: ctx.env, localType: a.localType, localId: a.localId, resourceType: a.localType, ihsId, hash, versionId });
}

function versionOf(body: unknown): string | null {
  return (body as FhirResourceBase | null)?.meta?.versionId ?? null;
}

// ── Pratinjau payload 1 item (konsol Resource, tanpa panggilan) ──

type LocalOrg = NonNullable<Awaited<ReturnType<typeof sourceDal.getOrganization>>>;
type LocalLoc = NonNullable<Awaited<ReturnType<typeof sourceDal.getLocation>>>;

export interface MasterPreview {
  resource: FhirResourceBase | null;
  status: PayloadStatus | null;
  note: string | null;
  /** Baris master lokal (null = tidak ada / terhapus) — dipakai ulang detail Prerequisites. */
  local: LocalOrg | LocalLoc | null;
}

/**
 * Pratinjau 1 Organization/Location dengan builder yang SAMA dengan sinkron. Hanya lookup PK
 * (data + induk + peta), tidak memuat seluruh master — biaya konstan berapa pun jumlah unit/ruangan.
 */
export async function previewMaster(localType: "Organization" | "Location", localId: string): Promise<MasterPreview> {
  const cfg = getSatuSehatConfig();
  const pending = "(belum-terpetakan)";
  const orgIhsOf = async (orgId: string) => (await resourceMapDal.findByLocal(cfg.mode, "Organization", orgId))?.ihsId;

  let resource: FhirResourceBase;
  let local: LocalOrg | LocalLoc;
  let existing: Awaited<ReturnType<typeof resourceMapDal.findByLocal>>;

  if (localType === "Organization") {
    const [o, map] = await Promise.all([sourceDal.getOrganization(localId), resourceMapDal.findByLocal(cfg.mode, localType, localId)]);
    if (!o) return { resource: null, status: null, note: "Data unit lokal tidak ditemukan / sudah dihapus", local: null };
    if (o.isRoot) {
      return { resource: null, status: null, note: "Root RS dipetakan langsung ke SATUSEHAT_ORG_ID (terdaftar via DevHub) — tidak dikirim", local: o };
    }
    const partOfIhsId = o.parentId ? ((await orgIhsOf(o.parentId)) ?? pending) : cfg.orgId;
    resource = toFhirOrganization(o, { orgId: cfg.orgId, partOfIhsId });
    local = o;
    existing = map;
  } else {
    const [l, map] = await Promise.all([sourceDal.getLocation(localId), resourceMapDal.findByLocal(cfg.mode, localType, localId)]);
    if (!l) return { resource: null, status: null, note: "Data ruangan lokal tidak ditemukan / sudah dihapus", local: null };
    const [org, orgIhs] = await Promise.all([sourceDal.getOrganization(l.organizationId), orgIhsOf(l.organizationId)]);
    resource = toFhirLocation(l, {
      orgId: cfg.orgId,
      managingOrgIhsId: orgIhs ?? (org?.isRoot ? cfg.orgId : pending),
      parentAddress: org ?? {},
      parentGps: org ? { lat: org.gpsLat, lng: org.gpsLng } : undefined,
    });
    local = l;
    existing = map;
  }

  if (!existing) return { resource, status: "new", note: null, local };
  return {
    resource: { ...resource, id: existing.ihsId },
    status: existing.hash === hashOf(resource) ? "synced" : "changed",
    note: existing.hash ? null : "Ditemukan sudah terdaftar (resolve) — diselaraskan (PUT) pada sinkron berikutnya",
    local,
  };
}

function hasIdentifier(r: FhirResourceBase, system: string, value: string): boolean {
  const ids = (r as { identifier?: { system?: string; value?: string }[] }).identifier ?? [];
  return ids.some((i) => i.system === system && i.value === value);
}

// ── Ringkasan (GET) ─────────────────────────────────────────

export async function summary(): Promise<OnboardingSummaryDTO> {
  const cfg = getSatuSehatConfig();
  const [orgs, locs, pegawai, orgMaps, locMaps, pracMaps, pasien] = await Promise.all([
    sourceDal.listOrganizations(),
    sourceDal.listLocations(),
    sourceDal.listPractitionerCandidates(),
    resourceMapDal.listByType(cfg.mode, LOCAL_TYPE.organization),
    resourceMapDal.listByType(cfg.mode, LOCAL_TYPE.location),
    resourceMapDal.listByType(cfg.mode, LOCAL_TYPE.practitioner),
    patientSourceDal.countIhsReadiness(cfg.mode),
  ]);

  const build = (rows: { id: string; kode: string; nama: string }[], maps: { localId: string }[]) => {
    const mapped = new Set(maps.map((m) => m.localId));
    const belum = rows.filter((r) => !mapped.has(r.id));
    return { lokal: rows.length, terpetakan: rows.length - belum.length, belum: belum.slice(0, 50).map((r) => ({ localId: r.id, kode: r.kode, nama: r.nama })) };
  };

  return {
    mode: cfg.mode,
    orgId: cfg.orgId,
    perJenis: {
      organization: build(orgs.filter((o) => o.active || o.isRoot), orgMaps),
      location: build(locs.filter((l) => l.active), locMaps),
      practitioner: build(
        pegawai.filter((p) => p.profesi && !NON_NAKES.has(p.profesi)).map((p) => ({ id: p.id, kode: p.nip, nama: p.namaLengkap })),
        pracMaps,
      ),
    },
    pasien: { total: pasien.total, viaNik: pasien.via_nik, terpetakan: pasien.terpetakan },
  };
}
