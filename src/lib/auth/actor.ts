// Actor = identitas terverifikasi yang melakukan request (hasil AuthN).
// FLOWS §6: AuthN/RBAC di Route guard; ABAC unit-scope + IDOR di Service via scopeBy(actor).
//
// ⚠️ SEAM: runtime auth (Auth.js hybrid) BELUM dibangun (BACKEND-AUTH). getActor() kini
// mengembalikan DEV actor (super-akses) agar endpoint bisa dikembangkan & diuji.
// Saat auth siap: ganti isi getActor() (verify JWT + Redis revoke) — signature TETAP,
// jadi Route/Service tak berubah. assertCan() jadi titik tunggal penegakan RBAC.

import { Errors } from "@/lib/errors/appError";

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

// Sentinel dev actor — DIHAPUS perilakunya saat BACKEND-AUTH selesai.
const DEV_ACTOR: Actor = {
  userId: "00000000-0000-0000-0000-000000000000",
  pegawaiId: "00000000-0000-0000-0000-000000000000",
  roles: ["DEV"],
  permissions: new Set<string>(["*"]),
  unitIds: [],
  isGlobal: true,
};

/**
 * Resolusi actor dari request (cookie/Authorization). STUB: selalu DEV actor.
 * TODO(BACKEND-AUTH): verify session JWT + cek revocation Redis → 401 bila invalid.
 */
export async function getActor(_req: Request): Promise<Actor> {
  return DEV_ACTOR;
}

/**
 * Actor untuk konteks SERVER tanpa Request (Server Component / job / SSR Service-call langsung).
 * STUB: DEV actor. TODO(BACKEND-AUTH): resolve dari cookies()/session Auth.js.
 */
export async function getServerActor(): Promise<Actor> {
  return DEV_ACTOR;
}

/** RBAC assert (FLOWS §6). Lempar FORBIDDEN bila role tak punya izin. */
export function assertCan(actor: Actor, resource: string, action: string): void {
  if (actor.isGlobal || actor.permissions.has("*")) return;
  if (actor.permissions.has(`${resource}:${action}`)) return;
  throw Errors.forbidden(`Tidak punya izin ${resource}:${action}`);
}
