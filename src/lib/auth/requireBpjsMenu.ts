import "server-only";
import { redirect } from "next/navigation";
import { getServerActor, type Actor } from "@/lib/auth/actor";
import { bpjsNav, navItemVisible, type Can, type NavItem } from "@/lib/navigation";

// Guard SERVER per-MENU modul EHIS BPJS (pola requireCareService). `requireModule("bpjs")` di
// layout hanya memeriksa `bpjs.view` (boleh melihat modul); guard ini menegakkan izin per menu
// (bpjs.sep, bpjs.aplicares, …) supaya halaman tidak terbuka hanya dengan mengetik URL.
// Single source = bpjsNav (lookup by href) → aturan IDENTIK dengan Sidebar & menu Beranda.
// Penegak utama tetap API (assertCan per route); ini benteng UI.

function itemByHref(href: string): NavItem | undefined {
  for (const g of bpjsNav) {
    const found = g.items.find((it) => it.href === href);
    if (found) return found;
  }
  return undefined;
}

/** Pastikan actor boleh membuka menu BPJS `href`; bila tidak → kembali ke Beranda BPJS. */
export async function requireBpjsMenu(href: string): Promise<void> {
  const item = itemByHref(href);
  if (!item?.perm) return; // Beranda / item tanpa perm → cukup gerbang modul

  let actor: Actor;
  try {
    actor = await getServerActor();
  } catch {
    redirect("/"); // tak ada sesi valid (enforce) → login
  }
  const can: Can = (r, a) => actor.isSuperuser || actor.permissions.has("*") || actor.permissions.has(`${r}:${a}`);
  if (!navItemVisible(item, can)) redirect("/ehis-bpjs");
}
