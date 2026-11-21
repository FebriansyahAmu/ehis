// Log pengiriman SatuSehat per data (konsol /ehis-fhir): daftar panggilan (keyset) + detail isi
// request/response. Read-only. Isi dibuka (dekripsi) HANYA di detail 1 panggilan; daftar tak pernah
// membaca kolom body.

import "server-only";
import { getSatuSehatConfig } from "@/lib/fhir/server/config";
import { Errors } from "@/lib/errors/appError";
import * as auditDal from "@/lib/dal/fhir/auditDal";
import type { SendLogDetailDTO, SendLogPageDTO, SendLogQuery, SendLogRowDTO } from "@/lib/schemas/fhir/sendLog";
import { openBody } from "./auditBody";

function encodeCursor(at: Date, id: string): string {
  return Buffer.from(`${at.toISOString()}|${id}`).toString("base64url");
}

function decodeCursor(raw: string): { at: Date; id: string } {
  const [iso, id] = Buffer.from(raw, "base64url").toString("utf8").split("|");
  const at = new Date(iso ?? "");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id) || Number.isNaN(at.getTime())) throw Errors.validation("Cursor tidak valid");
  return { at, id };
}

function toRow(r: auditDal.SendLogRow): SendLogRowDTO {
  return {
    id: r.id,
    startedAt: r.started_at.toISOString(),
    method: r.method,
    target: r.target,
    endpoint: r.endpoint,
    path: r.request_path,
    resourceType: r.resource_type,
    ihsId: r.ihs_id,
    status: r.response_status,
    success: r.success,
    durationMs: r.duration_ms,
    errorType: r.error_type,
    retryCount: r.retry_count,
    actor: r.actor,
    actorNama: r.actor.startsWith("system:") ? "Sistem (antrean kirim)" : r.actor_nama,
    viaBundle: r.local_type === "Bundle",
    entryIndex: r.entry_index,
    entryCount: r.entry_count,
    hasBody: r.has_body,
  };
}

export async function listForTarget(q: SendLogQuery): Promise<SendLogPageDTO> {
  const cfg = getSatuSehatConfig();
  const target: auditDal.SendLogTarget = {
    mode: cfg.mode, localType: q.localType, localId: q.localId, kunjunganId: q.kunjunganId ?? null,
  };
  const cursor = q.cursor ? decodeCursor(q.cursor) : undefined;

  const [rows, total] = await Promise.all([
    auditDal.listForTarget(target, { cursor, limit: q.limit }),
    cursor ? Promise.resolve(null) : auditDal.countForTarget(target),
  ]);
  const more = rows.length > q.limit;
  const page = more ? rows.slice(0, q.limit) : rows;
  const last = page[page.length - 1];
  return {
    mode: cfg.mode,
    rows: page.map(toRow),
    nextCursor: more && last ? encodeCursor(last.started_at, last.id) : null,
    total,
    retensiHari: cfg.logBodyDays,
  };
}

export async function getDetail(id: string, focus: { localType?: string; localId?: string }): Promise<SendLogDetailDTO> {
  const focusKey = focus.localType && focus.localId ? `${focus.localType}|${focus.localId}` : null;
  const r = await auditDal.getDetail(id, focusKey);
  if (!r) throw Errors.notFound("Log pengiriman tidak ditemukan");

  let request: unknown = null;
  let response: unknown = null;
  try {
    request = openBody(r.request_enc, !!r.truncated);
    response = openBody(r.response_enc, !!r.truncated);
  } catch {
    // Kunci enkripsi berganti / data rusak → metadata tetap tampil.
    request = response = "(isi log tidak dapat didekripsi)";
  }

  return {
    ...toRow(r),
    mode: r.mode,
    localType: r.local_type,
    localId: r.local_id,
    kunjunganId: r.kunjungan_id,
    request: { body: request, bytes: r.request_bytes },
    response: { body: response, bytes: r.response_bytes },
    truncated: !!r.truncated,
  };
}
