// route() — wrapper Route handler yang SERAGAM (FLOWS §2/§3). Setiap endpoint:
//   Origin(assertAllowedOrigin) → AuthN(getActor) → RBAC(assertCan) → Zod(params/query/body) →
//   handler(1 service) → envelope sukses → handleError pada exception.
// Route jadi TIPIS: tak ada try/catch, parsing, atau if-else domain tersebar.
//
// Pemakaian:
//   export const POST = route({
//     resource: "registration.pasien", action: "create",
//     body: RegisterPatientInput, status: 201,
//     handler: ({ body, actor }) => patientService.registerPatient(body, actor),
//   });

import { NextResponse, after } from "next/server";
import type { ZodType } from "zod";
import { getActor, assertCan, type Actor } from "@/lib/auth/actor";
import { handleError } from "@/lib/errors/handleError";
import { success, type Meta } from "@/lib/http/envelope";
import { Errors } from "@/lib/errors/appError";
import { loadKunjunganInScope } from "@/lib/services/clinicalScope";
import { assertAllowedOrigin } from "@/lib/http/originGuard";
import {
  aksesRekamMedisService,
  clientIp,
  domainFromPath,
  type AksesSubject,
} from "@/lib/services/audit/aksesRekamMedisService";

// Hasil ber-anotasi (status/message/meta) tanpa membuat `data` ambigu. Handler boleh
// kembalikan data mentah (→ status default, tanpa message) ATAU reply(...) untuk kontrol.
const REPLY = Symbol("ehis.reply");
interface Reply<T> {
  [REPLY]: true;
  data: T;
  status?: number;
  message?: string;
  meta?: Meta;
}

/** Bungkus hasil dengan status/message/meta eksplisit (mis. 201 + "Pasien dibuat"). */
export function reply<T>(data: T, opts: { status?: number; message?: string; meta?: Meta } = {}): Reply<T> {
  return { [REPLY]: true, data, ...opts };
}

/** Shortcut list: data + meta cursor (→ envelope.meta). */
export function paginated<T>(data: T, meta: Meta): Reply<T> {
  return reply(data, { meta });
}

/** Data di balik reply(...) — yang diterima opsi `aksesLog`. */
type Unreply<R> = R extends Reply<infer T> ? T : R;

function isReply(v: unknown): v is Reply<unknown> {
  return typeof v === "object" && v !== null && (v as Record<symbol, unknown>)[REPLY] === true;
}

interface HandlerArgs<B, Q, P> {
  req: Request;
  body: B;
  query: Q;
  params: P;
  actor: Actor;
  idempotencyKey?: string;
}

interface RouteConfig<B, Q, P, R> {
  /** RBAC (FLOWS §6) — bila di-set, assertCan dijalankan sebelum handler. */
  resource?: string;
  action?: string;
  body?: ZodType<B>;
  query?: ZodType<Q>;
  params?: ZodType<P>;
  /** HTTP status sukses (default 200; POST create → 201). */
  status?: number;
  /** ABAC unit-scope (FLOWS §6): bila true, `params.id` diperlakukan sebagai kunjunganId
   *  → ditolak (404) bila di luar unit kerja actor. Default ON untuk resource `clinical.*`
   *  (semua endpoint rekam medis = /kunjungan/[id]/…). Set `false` utk mematikan. */
  scopeKunjungan?: boolean;
  /** Kecualikan dari LOCK rekam medis (kunjungan Selesai). HANYA untuk dokumen
   *  administrasi kepulangan yang memang dikerjakan PASCA-pulang (tab Pasien Pulang):
   *  resume medik (PMK 269 — dilengkapi ≤1×24 jam setelah pulang), jadwal kontrol,
   *  pengembalian obat. Data klinis inti (CPPT/TTV/diagnosa/…) TIDAK boleh pakai ini. */
  allowWhenLocked?: boolean;
  /** Log akses BACA rekam medis (PRD E5 · FR-5.1). GET ber-scopeKunjungan dicatat OTOMATIS.
   *  Rute GET lain yang menampilkan data pasien (detail pasien, order Lab/Rad/Farmasi) memasang
   *  ini: kembalikan subjek dari hasil handler (kunjunganId cukup — pasien/unit diturunkan). */
  aksesLog?: (data: Unreply<R>, params: P) => (AksesSubject & { domain?: string }) | null;
  handler: (args: HandlerArgs<B, Q, P>) => Promise<R> | R;
}

type Ctx = { params?: Promise<Record<string, string>> };

async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw Errors.validation("Body bukan JSON yang valid");
  }
}

export function route<B = undefined, Q = undefined, P = undefined, R = unknown>(
  config: RouteConfig<B, Q, P, R>,
) {
  return async (req: Request, ctx?: Ctx): Promise<Response> => {
    try {
      // SG-02: tolak request lintas situs SEBELUM AuthN (tak bocorkan status sesi).
      assertAllowedOrigin(req);
      const actor = await getActor(req);
      if (config.resource && config.action) assertCan(actor, config.resource, config.action);

      const rawParams = ctx?.params ? await ctx.params : {};
      const params = (config.params ? config.params.parse(rawParams) : rawParams) as P;

      // ABAC unit-scope (anti-IDOR): clinical.* → params.id = kunjunganId harus di unit kerja actor.
      const scopeKunjungan = config.scopeKunjungan ?? !!config.resource?.startsWith("clinical.");
      const ip = clientIp(req);
      const domain = domainFromPath(new URL(req.url).pathname);
      let scoped: AksesSubject | null = null;
      if (scopeKunjungan) {
        const id = (params as { id?: unknown } | undefined)?.id;
        if (typeof id === "string") {
          const k = await loadKunjunganInScope(id, actor, undefined, {
            // Percobaan membuka kunjungan di luar unit kerja → dicatat "denied" (method apa pun).
            onDenied: (d) =>
              after(() =>
                aksesRekamMedisService.recordRead({
                  actor, kunjunganId: d.id, patientId: d.patientId, unit: d.unit, domain, outcome: "denied", ip,
                }),
              ),
          });
          scoped = { kunjunganId: k.id, patientId: k.patientId, unit: k.unit };
          // Lock rekam medis: kunjungan Selesai (lockedAt) → tolak TULIS clinical.* (baca tetap
          // lolos). Transisi lifecycle pakai resource registration.* (action read) → tak terkena,
          // jadi "Batal Selesai" tetap bisa membuka kunci. Rute ber-`allowWhenLocked` (dokumen
          // administrasi kepulangan — tab Pasien Pulang) dikecualikan.
          const isWrite =
            config.action === "create" || config.action === "update" || config.action === "delete";
          if (isWrite && !config.allowWhenLocked && config.resource?.startsWith("clinical.") && k.lockedAt) {
            throw Errors.forbiddenState(
              "Rekam medis terkunci — kunjungan sudah diselesaikan. Batalkan penyelesaian untuk mengubah.",
            );
          }
        }
      }

      const rawQuery = Object.fromEntries(new URL(req.url).searchParams);
      const query = (config.query ? config.query.parse(rawQuery) : undefined) as Q;

      const body = (config.body ? config.body.parse(await readJson(req)) : undefined) as B;

      const idempotencyKey = req.headers.get("Idempotency-Key") ?? undefined;

      const result = await config.handler({ req, body, query, params, actor, idempotencyKey });

      // Log akses BACA rekam medis — sesudah respons terkirim (tak memperlambat/menggagalkan GET).
      if (req.method === "GET") {
        const data = (isReply(result) ? result.data : result) as Unreply<R>;
        const subj = scoped ?? config.aksesLog?.(data, params) ?? null;
        if (subj) {
          const d = (subj as { domain?: string }).domain ?? domain;
          after(() => aksesRekamMedisService.recordRead({ actor, ...subj, domain: d, outcome: "allowed", ip }));
        }
      }

      const fallback = config.status ?? 200;
      if (isReply(result)) {
        return NextResponse.json(success(result.data, result.message, result.meta), {
          status: result.status ?? fallback,
        });
      }
      return NextResponse.json(success(result), { status: fallback });
    } catch (e) {
      const { status, body } = handleError(e);
      return NextResponse.json(body, { status });
    }
  };
}
