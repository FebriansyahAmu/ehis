// Superuser = bypass RBAC PENUH (dianggap punya semua izin). HANYA role Admin.
//
// DIPISAH dari `unitScoped` (ABAC): `unitScoped=false` cuma berarti role "tak diikat unit
// tertentu" (mis. Registrasi/Kasir registrasi/bayar lintas unit), BUKAN "punya semua izin".
// Sebelumnya keduanya tertukar (`isGlobal = unitScoped===false` lalu dipakai assertCan) →
// role global keliru bypass seluruh RBAC. Lihat docs/BACKEND-AUTH.md §11 / TODO-RBAC-MODUL Fase 1.
//
// Data-driven minimal: superuser = kepemilikan role kunci tertentu (default: Admin). Bila kelak
// perlu lebih dari satu, tambah di sini (atau pindah ke kolom Role.superuser + migration).

export const SUPERUSER_ROLE_KEYS: readonly string[] = ["Admin"];

/** true bila salah satu role = superuser (bypass RBAC). */
export function hasSuperuserRole(roles: readonly string[]): boolean {
  return roles.some((r) => SUPERUSER_ROLE_KEYS.includes(r));
}
