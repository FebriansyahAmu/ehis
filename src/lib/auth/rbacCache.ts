// RBAC cache — peta roleKey → Set("resource:action") dari auth.RolePermission.
// Acuan BACKEND-AUTH §2.5: idealnya cache Redis `perm:{roleId}`. Redis DITUNDA → cache
// IN-PROCESS dengan TTL pendek (cukup untuk single-node). Saat Redis aktif: ganti substrat
// cache di sini saja; pemanggil (getActor) tak berubah.
//
// Permission efektif user = UNION grant lintas semua role-nya (paling permisif menang, §10 #1).

import * as authDal from "@/lib/dal/authDal";

const TTL_MS = 60_000; // 1 menit — perubahan RBAC di Mapping Hub terlihat ≤1m (bounded staleness).

let cache: Map<string, Set<string>> | null = null;
let loadedAt = 0;
let inflight: Promise<Map<string, Set<string>>> | null = null;

async function load(): Promise<Map<string, Set<string>>> {
  const rows = await authDal.loadRolePermissions();
  const map = new Map<string, Set<string>>();
  for (const { roleKey, kode } of rows) {
    let set = map.get(roleKey);
    if (!set) { set = new Set(); map.set(roleKey, set); }
    set.add(kode);
  }
  return map;
}

async function getMap(): Promise<Map<string, Set<string>>> {
  const fresh = cache && Date.now() - loadedAt < TTL_MS;
  if (fresh) return cache!;
  if (inflight) return inflight;
  inflight = load().then((m) => {
    cache = m;
    loadedAt = Date.now();
    inflight = null;
    return m;
  }).catch((e) => {
    inflight = null;
    throw e;
  });
  return inflight;
}

/** Permission efektif (union) untuk sekumpulan role key. */
export async function permissionsForRoles(roleKeys: string[]): Promise<Set<string>> {
  const map = await getMap();
  const out = new Set<string>();
  for (const key of roleKeys) {
    const set = map.get(key);
    if (set) for (const k of set) out.add(k);
  }
  return out;
}

/** Paksa muat ulang (panggil saat Mapping Hub mengubah RolePermission). */
export function invalidateRbacCache(): void {
  cache = null;
  loadedAt = 0;
}
