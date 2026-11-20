// Sakelar penegakan autentikasi — SG-03 (docs/SECURITY-GAP.md).
// AUTH_ENFORCE=true → request tanpa sesi ditolak (401) dan page diarahkan ke login.
// Di PRODUCTION penegakan SELALU aktif, apa pun nilai AUTH_ENFORCE (fail-safe): deployment yang
// lupa men-set flag tidak boleh berubah jadi "semua orang = DEV actor superuser".
// DEV actor (lib/auth/actor.ts) hanya mungkin di development/test.
//
// Sengaja tanpa import lain: dipakai juga oleh src/proxy.ts yang harus tetap ringan.

export function isAuthEnforced(): boolean {
  return process.env.AUTH_ENFORCE === "true" || process.env.NODE_ENV === "production";
}
