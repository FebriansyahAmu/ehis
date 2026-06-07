import "server-only";
import { redirect } from "next/navigation";
import { getServerActor, type Actor } from "@/lib/auth/actor";
import { getModule, canSeeModule, homeHref, type ModuleKey, type Can } from "@/lib/navigation";

// Guard SERVER per-modul (Fase 2 TODO-RBAC-MODUL). Dipanggil di layout modul.
// Benteng kedua di atas menu-gating klien (yang bisa dilewati dgn ketik URL). Penjaga
// utama tetap API (assertCan per route). Saat AUTH_ENFORCE=false, getServerActor → DEV
// actor (isSuperuser) → semua lolos (transisi). Saat enforce, tanpa sesi → ke "/".
export async function requireModule(key: ModuleKey): Promise<void> {
  let actor: Actor;
  try {
    actor = await getServerActor();
  } catch {
    redirect("/"); // tak ada sesi valid (enforce) → login (redirect = never)
  }
  const can: Can = (r, a) => actor.isSuperuser || actor.permissions.has(`${r}:${a}`);
  if (!canSeeModule(getModule(key), can)) {
    redirect(homeHref(can)); // ke "rumah" aman yang boleh dilihat (cegah dead-end/loop)
  }
}
