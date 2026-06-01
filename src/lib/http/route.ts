// route() — wrapper Route handler yang SERAGAM (FLOWS §2/§3). Setiap endpoint:
//   AuthN(getActor) → RBAC(assertCan) → Zod(params/query/body) → handler(1 service) →
//   envelope sukses → handleError pada exception.
// Route jadi TIPIS: tak ada try/catch, parsing, atau if-else domain tersebar.
//
// Pemakaian:
//   export const POST = route({
//     resource: "registration.patient", action: "create",
//     body: RegisterPatientInput, status: 201,
//     handler: ({ body, actor }) => patientService.registerPatient(body, actor),
//   });

import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { getActor, assertCan, type Actor } from "@/lib/auth/actor";
import { handleError } from "@/lib/errors/handleError";
import { success, type Meta } from "@/lib/http/envelope";
import { Errors } from "@/lib/errors/appError";

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
      const actor = await getActor(req);
      if (config.resource && config.action) assertCan(actor, config.resource, config.action);

      const rawParams = ctx?.params ? await ctx.params : {};
      const params = (config.params ? config.params.parse(rawParams) : rawParams) as P;

      const rawQuery = Object.fromEntries(new URL(req.url).searchParams);
      const query = (config.query ? config.query.parse(rawQuery) : undefined) as Q;

      const body = (config.body ? config.body.parse(await readJson(req)) : undefined) as B;

      const idempotencyKey = req.headers.get("Idempotency-Key") ?? undefined;

      const result = await config.handler({ req, body, query, params, actor, idempotencyKey });

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
