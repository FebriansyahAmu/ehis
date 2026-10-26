// FH7 — ResourceSink: cara job kunjungan mengirim resource ke SatuSehat.
//
//   single : tiap resource langsung POST/PUT (upsertClinicalResource) — perilaku FH3–FH6.
//   bundle : resource DIKUMPULKAN → 1 POST `Bundle type=transaction` per kunjungan (R16, atomik).
//            Resource baru dapat id sementara `urn:uuid:<x>`; referensi `Type/urn:uuid:<x>` buatan
//            adapter ditulis ulang jadi `urn:uuid:<x>` saat kirim. Respons `location` dipetakan balik
//            ke ResourceMap; hash dihitung dari bentuk ber-id ASLI agar run berikutnya noop.
//
// Mode dari SATUSEHAT_SYNC_MODE (default bundle). Antarmuka sama → service FH4–FH6 tak peduli mode.

import "server-only";
import { randomUUID } from "node:crypto";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import type { Bundle, FhirError, FhirResourceBase, SatuSehatMode } from "@/lib/fhir/fhirShared";
import { fhirRequest, type FhirRequestAudit } from "./transport";
import { hashOf, upsertClinicalResource, type UpsertResult } from "./resourceUpsert";

export interface SubmitArgs {
  localType: string;
  localId: string;
  resource: FhirResourceBase;
  /** false = hanya update bila sudah terpetakan (data terhapus → entered-in-error). */
  allowCreate?: boolean;
}

export type FlushResult =
  | { ok: true; resolved: Map<string, string>; sent: number }
  | { ok: false; error: FhirError };

export interface ResourceSink {
  readonly mode: "single" | "bundle";
  submit(a: SubmitArgs): Promise<UpsertResult | null>;
  /** bundle: kirim transaksi. single: no-op. `resolved` = id sementara → IHS id. */
  flush(): Promise<FlushResult>;
}

type Audit = Pick<FhirRequestAudit, "actor" | "actorRole">;

/** `kunjunganId` = pemilik resource (disimpan di peta untuk konsol Resource/Kunjungan). */
export function makeSink(mode: "single" | "bundle", env: SatuSehatMode, audit: Audit, kunjunganId?: string): ResourceSink {
  return mode === "bundle" ? bundleSink(env, audit, kunjunganId) : singleSink(env, audit, kunjunganId);
}

function singleSink(env: SatuSehatMode, audit: Audit, kunjunganId?: string): ResourceSink {
  return {
    mode: "single",
    submit: (a) => upsertClinicalResource({ env, audit, kunjunganId, ...a }),
    flush: async () => ({ ok: true, resolved: new Map(), sent: 0 }),
  };
}

// ── Pratinjau (konsol) ──────────────────────────────────────
// Sink TANPA jaringan & TANPA tulis DB: menangkap resource yang AKAN dikirim job kunjungan dan
// membandingkan hash-nya dengan peta. Hash sama = payload identik dengan yang sudah diterima SatuSehat.

export type PreviewStatus = "synced" | "changed" | "new";

export interface PreviewItem {
  localType: string;
  localId: string;
  resourceType: string;
  status: PreviewStatus;
  /** IHS id bila sudah terpetakan; null = belum pernah terkirim. */
  ihsId: string | null;
  /** Bentuk yang dikirim (PUT menyertakan `id`). */
  resource: FhirResourceBase;
  lastSyncAt: Date | null;
  versionId: string | null;
}

export interface PreviewSink extends ResourceSink {
  items(): PreviewItem[];
}

type MapRow = Awaited<ReturnType<typeof resourceMapDal.findByLocal>>;

export function makePreviewSink(env: SatuSehatMode): PreviewSink {
  const captured = new Map<string, { a: SubmitArgs; existing: MapRow; tmpId: string }>();
  const statusOf = (a: SubmitArgs, existing: MapRow): PreviewStatus =>
    !existing ? "new" : existing.hash === hashOf(a.resource) ? "synced" : "changed";
  const OP = { synced: "noop", changed: "update", new: "create" } as const;

  return {
    mode: "bundle",

    async submit(a) {
      const key = `${a.localType}|${a.localId}`;
      const queued = captured.get(key);
      if (queued) {
        queued.a = a;
        return { ok: true, ihsId: queued.existing?.ihsId ?? queued.tmpId, op: OP[statusOf(a, queued.existing)] };
      }
      const existing = await resourceMapDal.findByLocal(env, a.localType, a.localId);
      if (!existing && a.allowCreate === false) return null;
      const tmpId = `${URN}${randomUUID()}`;
      captured.set(key, { a, existing, tmpId });
      return { ok: true, ihsId: existing?.ihsId ?? tmpId, op: OP[statusOf(a, existing)] };
    },

    flush: async () => ({ ok: true, resolved: new Map(), sent: 0 }),

    items() {
      return [...captured.values()].map(({ a, existing }) => ({
        localType: a.localType,
        localId: a.localId,
        resourceType: a.resource.resourceType,
        status: statusOf(a, existing),
        ihsId: existing?.ihsId ?? null,
        resource: existing ? { ...a.resource, id: existing.ihsId } : a.resource,
        lastSyncAt: existing?.lastSyncAt ?? null,
        versionId: existing?.versionId ?? null,
      }));
    },
  };
}

interface Pending {
  localType: string;
  localId: string;
  resource: FhirResourceBase;
  method: "POST" | "PUT";
  /** PUT: IHS id nyata · POST: `urn:uuid:<x>` sementara. */
  ihsId: string;
  fullUrl: string;
}

const URN = "urn:uuid:";
/** `"Encounter/urn:uuid:…"` (bentuk adapter) → `"urn:uuid:…"` (referensi intra-bundle). */
const toBundleRefs = (json: string) => json.replace(/"[A-Za-z]+\/urn:uuid:/g, `"${URN}`);

function bundleSink(env: SatuSehatMode, audit: Audit, kunjunganId?: string): ResourceSink {
  const pending = new Map<string, Pending>(); // urutan sisip = urutan entry (Encounter duluan)

  return {
    mode: "bundle",

    async submit(a) {
      const key = `${a.localType}|${a.localId}`;
      const queued = pending.get(key);
      if (queued) {
        // Kirim ulang resource yang sama dalam 1 job (mis. Encounter final) → ganti isi entry.
        queued.resource = a.resource;
        return { ok: true, ihsId: queued.ihsId, op: queued.method === "POST" ? "create" : "update" };
      }

      const existing = await resourceMapDal.findByLocal(env, a.localType, a.localId);
      if (!existing && a.allowCreate === false) return null;
      if (existing?.hash === hashOf(a.resource)) {
        if (kunjunganId && !existing.kunjunganId) await resourceMapDal.attachKunjungan(existing.id, kunjunganId);
        return { ok: true, ihsId: existing.ihsId, op: "noop" };
      }

      const p: Pending = existing
        ? { ...a, method: "PUT", ihsId: existing.ihsId, fullUrl: `${URN}${randomUUID()}` }
        : (() => {
            const id = `${URN}${randomUUID()}`;
            return { ...a, method: "POST" as const, ihsId: id, fullUrl: id };
          })();
      pending.set(key, p);
      return { ok: true, ihsId: p.ihsId, op: existing ? "update" : "create" };
    },

    async flush() {
      if (!pending.size) return { ok: true, resolved: new Map(), sent: 0 };
      const list = [...pending.values()];

      const bundle: Bundle = {
        resourceType: "Bundle",
        type: "transaction",
        entry: list.map((p) => ({
          fullUrl: p.fullUrl,
          resource: JSON.parse(toBundleRefs(JSON.stringify(p.method === "PUT" ? { ...p.resource, id: p.ihsId } : p.resource))),
          request: { method: p.method, url: p.method === "PUT" ? `${p.resource.resourceType}/${p.ihsId}` : p.resource.resourceType },
        })),
      };

      const res = await fhirRequest<Bundle>(
        { method: "POST", path: "", body: bundle },
        { ...audit, endpoint: "Bundle(transaction)", resourceType: "Bundle" },
      );
      if (!res.ok) return { ok: false, error: res.error };

      const entries = res.value.body?.entry ?? [];
      const resolved = new Map<string, string>();
      for (const [i, p] of list.entries()) {
        const e = entries[i];
        const loc = e?.response?.location ?? "";
        const idFromLoc = loc.split("/")[1]; // "Type/<id>/_history/<v>"
        const ihsId = p.method === "PUT" ? p.ihsId : (e?.resource?.id ?? idFromLoc);
        if (!ihsId) {
          return { ok: false, error: { type: "HttpError", status: res.value.status, message: `Respons Bundle tanpa id untuk entry ${i + 1} (${p.resource.resourceType})`, retryable: false } };
        }
        if (p.method === "POST") resolved.set(p.ihsId, ihsId);
      }

      // Simpan peta: hash dari bentuk adapter ber-id ASLI (sama dgn yang dibangun run berikutnya).
      for (const [i, p] of list.entries()) {
        let json = JSON.stringify(p.resource);
        for (const [tmp, real] of resolved) json = json.split(tmp).join(real);
        const versionId = (entries[i]?.response?.location ?? "").split("/")[3] ?? null;
        await resourceMapDal.upsert({
          env, localType: p.localType, localId: p.localId, resourceType: p.resource.resourceType,
          ihsId: resolved.get(p.ihsId) ?? p.ihsId,
          hash: hashOf(JSON.parse(json)),
          versionId,
          kunjunganId,
        });
      }
      return { ok: true, resolved, sent: list.length };
    },
  };
}
