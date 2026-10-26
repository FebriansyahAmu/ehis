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
  OnboardingJenis, OnboardingItemResult, OnboardingOutcome, OnboardingRunDTO, OnboardingSummaryDTO,
} from "@/lib/schemas/fhir/onboarding";

/** Profesi non-nakes — tidak punya Practitioner di SatuSehat. */
const NON_NAKES = new Set(["Administrator", "Non-Tenaga Kesehatan"]);

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
    const nama = [p.gelarDepan, p.namaLengkap, p.gelarBelakang].filter(Boolean).join(" ");
    const base = { localId: p.id, kode: p.nip, nama };
    if (!p.profesi || NON_NAKES.has(p.profesi)) continue;

    const known = existing.get(p.id);
    if (known && !force) {
      out.push({ ...base, outcome: "unchanged", ihsId: known.ihsId });
      continue;
    }

    let nik: string;
    try {
      nik = decryptPii(p.nikEnc).replace(/\D/g, "");
    } catch {
      out.push({ ...base, outcome: "failed", message: "NIK tidak dapat didekripsi" });
      continue;
    }
    if (nik.length !== 16) {
      out.push({ ...base, outcome: "failed", message: "NIK pegawai tidak valid (harus 16 digit)" });
      continue;
    }

    const res = await fhirRequest<Bundle>(
      { method: "GET", path: `Practitioner?identifier=${encodeURIComponent(`${FHIR_SYSTEM.nik}|${nik}`)}` },
      { ...ctx.audit, endpoint: "Practitioner?identifier={nik}", resourceType: "Practitioner", nik },
    );
    if (!res.ok) {
      out.push({ ...base, outcome: "failed", message: res.error.message });
      continue;
    }
    const ihsId = res.value.body?.entry?.[0]?.resource?.id;
    if (!ihsId) {
      out.push({ ...base, outcome: "failed", message: "NIK tidak terdaftar sebagai nakes di SatuSehat (cek SISDMK/KKI)" });
      continue;
    }

    await resourceMapDal.upsert({ env: ctx.env, localType: "Practitioner", localId: p.id, resourceType: "Practitioner", ihsId });
    // Kolom denormalisasi master Dokter hanya diisi id PRODUKSI (id sandbox/mock tak berlaku di prod).
    if (ctx.env === "prod" && p.dokter && p.dokter.ihsPractitionerId !== ihsId) {
      await sourceDal.setDokterIhsPractitionerId(p.dokter.id, ihsId);
    }
    out.push({ ...base, outcome: known ? (known.ihsId === ihsId ? "unchanged" : "updated") : "resolved", ihsId });
  }
  return out;
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
}

async function upsertResource(ctx: Ctx, a: UpsertArgs): Promise<Pick<OnboardingItemResult, "outcome" | "ihsId" | "message">> {
  const hash = hashOf(a.resource);
  const type = a.localType;

  // 1) Sudah terpetakan → PUT bila berubah.
  if (a.existing) {
    if (a.existing.hash === hash) return { outcome: "unchanged", ihsId: a.existing.ihsId };
    const res = await fhirRequest(
      { method: "PUT", path: `${type}/${a.existing.ihsId}`, body: { ...a.resource, id: a.existing.ihsId } },
      { ...ctx.audit, endpoint: `${type}/{id}`, resourceType: type },
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
    { ...ctx.audit, endpoint: a.searchEndpoint, resourceType: type },
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
    { ...ctx.audit, endpoint: type, resourceType: type },
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

function hasIdentifier(r: FhirResourceBase, system: string, value: string): boolean {
  const ids = (r as { identifier?: { system?: string; value?: string }[] }).identifier ?? [];
  return ids.some((i) => i.system === system && i.value === value);
}

// ── Ringkasan (GET) ─────────────────────────────────────────

export async function summary(): Promise<OnboardingSummaryDTO> {
  const cfg = getSatuSehatConfig();
  const [orgs, locs, pegawai, orgMaps, locMaps, pracMaps] = await Promise.all([
    sourceDal.listOrganizations(),
    sourceDal.listLocations(),
    sourceDal.listPractitionerCandidates(),
    resourceMapDal.listByType(cfg.mode, LOCAL_TYPE.organization),
    resourceMapDal.listByType(cfg.mode, LOCAL_TYPE.location),
    resourceMapDal.listByType(cfg.mode, LOCAL_TYPE.practitioner),
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
  };
}
