// Actor = identitas terverifikasi yang melakukan request (hasil AuthN).
// FLOWS §6: AuthN/RBAC di Route guard; ABAC unit-scope + IDOR di Service via scopeBy(actor).
//
// Lapisan sesi = custom JWT (jose) — lihat lib/auth/jwt.ts. Redis DITUNDA:
//   • revocation per-request (jti blocklist + tokenVersion) BELUM → access kedaluwarsa ≤30m
//     membatasi window; revoke instan ditegakkan saat refresh (DB). (BACKEND-AUTH §5 degradasi.)
//   • permission di-expand dari roles via rbacCache (in-process, pengganti cache Redis perm:{}).
//
// Gate bertahap (BACKEND-AUTH §8): AUTH_ENFORCE=false (default) → request tanpa sesi valid
// jatuh ke DEV actor agar route yang belum dilindungi tetap jalan selama transisi. Set
// AUTH_ENFORCE=true untuk menolak (401) request tanpa sesi.

import { cookies } from "next/headers";
import { Errors } from "@/lib/errors/appError";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { permissionsForRoles } from "@/lib/auth/rbacCache";
import { readCookie, ACCESS_COOKIE } from "@/lib/auth/cookies";
import type { AccessClaims } from "@/lib/schemas/auth";

export interface Actor {
  userId: string;
  pegawaiId: string;
  roles: string[];
  /** Permission efektif "resource:action" (union lintas role). */
  permissions: Set<string>;
  /** Unit yang boleh diakses (ABAC). Kosong + bukan global = tak boleh data klinis. */
  unitIds: string[];
  /** true = bypass unit-scope (mis. Admin/role global). */
  isGlobal: boolean;
}

// Sentinel dev actor — hanya dipakai saat AUTH_ENFORCE=false & tak ada sesi (transisi).
const DEV_ACTOR: Actor = {
  userId: "00000000-0000-0000-0000-000000000000",
  pegawaiId: "00000000-0000-0000-0000-000000000000",
  roles: ["DEV"],
  permissions: new Set<string>(["*"]),
  unitIds: [],
  isGlobal: true,
};

const enforce = (): boolean => process.env.AUTH_ENFORCE === "true";

async function actorFromClaims(claims: AccessClaims): Promise<Actor> {
  const permissions = await permissionsForRoles(claims.roles);
  return {
    userId: claims.sub,
    pegawaiId: claims.pegawaiId,
    roles: claims.roles,
    permissions,
    unitIds: claims.unitIds,
    isGlobal: claims.isGlobal,
  };
}

/** Pilih: actor dari token (bila valid) → else 401 (enforce) → else DEV (transisi). */
async function resolve(token: string | null): Promise<Actor> {
  if (token) {
    try {
      return await actorFromClaims(await verifyAccessToken(token));
    } catch {
      // token basi/invalid: enforce → tolak; transisi → fall-through ke DEV.
      if (enforce()) throw Errors.unauthenticated();
    }
  }
  if (enforce()) throw Errors.unauthenticated();
  return DEV_ACTOR;
}

/** Resolusi actor dari Request (cookie access JWT, atau Authorization: Bearer). */
export async function getActor(req: Request): Promise<Actor> {
  const bearer = req.headers.get("authorization");
  const token =
    readCookie(req, ACCESS_COOKIE) ??
    (bearer?.toLowerCase().startsWith("bearer ") ? bearer.slice(7).trim() : null);
  return resolve(token);
}

/** Actor untuk konteks SERVER tanpa Request (Server Component / SSR Service-call). */
export async function getServerActor(): Promise<Actor> {
  const store = await cookies();
  return resolve(store.get(ACCESS_COOKIE)?.value ?? null);
}

/** RBAC assert (FLOWS §6). Lempar FORBIDDEN bila role tak punya izin. */
export function assertCan(actor: Actor, resource: string, action: string): void {
  if (actor.isGlobal || actor.permissions.has("*")) return;
  if (actor.permissions.has(`${resource}:${action}`)) return;
  throw Errors.forbidden(`Tidak punya izin ${resource}:${action}`);
}
