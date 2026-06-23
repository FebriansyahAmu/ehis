import "server-only";
import { redirect } from "next/navigation";
import { getServerActor, type Actor } from "@/lib/auth/actor";
import { careNav, navItemVisible, navScopeFrom, type Can, type NavItem } from "@/lib/navigation";

// Guard SERVER per-LAYANAN dalam modul Care. `requireModule("care")` (di ehis-care/layout)
// hanya menjaga visibilitas MODUL — punya ≥1 izin care → lolos, sehingga user penunjang
// (mis. Radiologi: ancillary.rad.*) tetap bisa mengetik URL /ehis-care/farmasi. Guard ini
// menegakkan akses PER-UNIT/penunjang dengan aturan IDENTIK kartu hub & menu Sidebar:
// RBAC perm + careUnit ABAC, bypass superuser (Admin) / role global. Single source = careNav
// (lookup by href) → tak ada duplikasi/drift definisi izin.
//
// Penegak utama tetap API (assertCan + ABAC per route/worklist); ini benteng UI agar halaman
// tak terbuka (selaras requireModule). Saat AUTH_ENFORCE=false → DEV actor (superuser) → lolos.

function careItemByHref(href: string): NavItem | undefined {
  for (const g of careNav) {
    const found = g.items.find((it) => it.href === href);
    if (found) return found;
  }
  return undefined;
}

/** Pastikan actor boleh mengakses layanan Care `href` (mis. "/ehis-care/farmasi").
 *  Tidak boleh → redirect ke hub Care (yang sudah memfilter kartu sesuai izin). */
export async function requireCareService(href: string): Promise<void> {
  const item = careItemByHref(href);
  if (!item) return; // bukan layanan ber-gate (mis. Beranda) → cukup gate modul

  let actor: Actor;
  try {
    actor = await getServerActor();
  } catch {
    redirect("/"); // tak ada sesi valid (enforce) → login
  }
  const can: Can = (r, a) => actor.isSuperuser || actor.permissions.has("*") || actor.permissions.has(`${r}:${a}`);
  if (!navItemVisible(item, can, navScopeFrom(actor))) {
    redirect("/ehis-care");
  }
}
