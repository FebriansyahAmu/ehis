// Primitif tunggal kirim resource klinis ke SatuSehat (R8): ResourceMap(env) → sudah ada & hash
// sama = noop · sudah ada & berubah = PUT · belum = POST lalu simpan peta. Dipakai Encounter (FH3)
// dan resource klinis (FH4). Resource yang RS miliki sendiri (bukan master SatuSehat) → tanpa search.

import "server-only";
import { createHash } from "node:crypto";
import * as resourceMapDal from "@/lib/dal/fhir/resourceMapDal";
import type { FhirError, FhirResourceBase, SatuSehatMode } from "@/lib/fhir/fhirShared";
import { fhirRequest, type FhirRequestAudit } from "./transport";

export type UpsertOp = "create" | "update" | "noop";

export type UpsertResult =
  | { ok: true; ihsId: string; op: UpsertOp }
  | { ok: false; error: FhirError };

export const hashOf = (r: unknown) => createHash("sha256").update(JSON.stringify(r)).digest("hex");

export async function upsertClinicalResource(args: {
  env: SatuSehatMode;
  localType: string;
  localId: string;
  resource: FhirResourceBase;
  audit: Pick<FhirRequestAudit, "actor" | "actorRole">;
  /** false = hanya PUT bila sudah terpetakan (mis. entered-in-error untuk data terhapus). */
  allowCreate?: boolean;
  /** Kunjungan pemilik — disimpan di peta untuk konsol Resource/Kunjungan. */
  kunjunganId?: string;
}): Promise<UpsertResult | null> {
  const { env, localType, localId, resource, kunjunganId } = args;
  const type = resource.resourceType;
  const existing = await resourceMapDal.findByLocal(env, localType, localId);
  const hash = hashOf(resource);

  if (existing?.hash === hash) {
    if (kunjunganId && !existing.kunjunganId) await resourceMapDal.attachKunjungan(existing.id, kunjunganId);
    return { ok: true, ihsId: existing.ihsId, op: "noop" };
  }
  if (!existing && args.allowCreate === false) return null;

  const link = { localType, localId, kunjunganId };
  const res = existing
    ? await fhirRequest<FhirResourceBase>(
        { method: "PUT", path: `${type}/${existing.ihsId}`, body: { ...resource, id: existing.ihsId } },
        { ...args.audit, ...link, endpoint: `${type}/{id}`, resourceType: type },
      )
    : await fhirRequest<FhirResourceBase>(
        { method: "POST", path: type, body: resource },
        { ...args.audit, ...link, endpoint: type, resourceType: type },
      );
  if (!res.ok) return { ok: false, error: res.error };

  const ihsId = existing?.ihsId ?? res.value.body?.id;
  if (!ihsId) {
    return { ok: false, error: { type: "HttpError", status: res.value.status, message: `Respons SatuSehat tanpa id ${type}`, retryable: false } };
  }
  await resourceMapDal.upsert({
    env, localType, localId, resourceType: type, ihsId, hash, kunjunganId,
    versionId: res.value.body?.meta?.versionId ?? null,
  });
  return { ok: true, ihsId, op: existing ? "update" : "create" };
}
