// Zod schema + tipe DTO domain Auth (login/sesi runtime). Acuan: docs/BACKEND-AUTH.md §3/§4.5.
// Output API TAK PERNAH membawa passwordHash / refresh plaintext / tokenVersion.
//
// Lapisan sesi = custom JWT (jose). Redis ditunda → revocation per-request belum (lihat actor.ts);
// revoke ditegakkan saat refresh (DB). Claims access token diketik di AccessClaims.

import { z } from "zod";

// ── Input ──────────────────────────────────────────────────────────────────---

export const LoginInput = z.object({
  username: z.string().trim().min(1, "Username wajib diisi").max(60),
  password: z.string().min(1, "Password wajib diisi").max(200),
  // mfaCode disiapkan (forward-compat) — enforcement MFA ditunda pasca-MVP.
  mfaCode: z.string().trim().optional(),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const ChangePasswordInput = z.object({
  passwordLama: z.string().min(1, "Password lama wajib diisi").max(200),
  passwordBaru: z.string().min(8, "Password baru minimal 8 karakter").max(200),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>;

// ── Token claims (access JWT) ──────────────────────────────────────────────---
// Identitas + otorisasi yang cukup untuk membangun Actor tanpa hit DB di jalur panas.
// Permission TIDAK di-embed (bisa besar) → di-expand dari roles via rbacCache (in-process).

export interface AccessClaims {
  /** userId (subject). */
  sub: string;
  pegawaiId: string;
  /** key role (mis. ["Dokter","SpPK"]). */
  roles: string[];
  /** true bila punya ≥1 role global (unitScoped=false) → bypass unit-scope. */
  isGlobal: boolean;
  /** unit (ruangan) yang boleh diakses (ABAC). */
  unitIds: string[];
  /** versi token; bump = revoke semua sesi (dicek saat refresh selama Redis ditunda). */
  tokenVersion: number;
  /** JWT id — untuk blocklist saat Redis aktif. */
  jti: string;
}

// ── Output DTO ─────────────────────────────────────────────────────────────---
// Sesi aktif yang dikembalikan ke klien (GET /auth/me). Tanpa rahasia.

export interface SessionDTO {
  userId: string;
  pegawaiId: string;
  username: string;
  namaTampil: string;
  roles: string[];
  /** true = tak diikat unit (ABAC). DARI unitScoped. BUKAN bypass RBAC. */
  isGlobal: boolean;
  /** true = superuser (Admin) → bypass RBAC di UI gating (`can()` selalu true). */
  isSuperuser: boolean;
  unitIds: string[];
  /** permission efektif "resource:action" (union lintas role) — untuk UI gating. */
  permissions: string[];
  mustChangePassword: boolean;
}
