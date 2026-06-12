/**
 * Klien pencarian KFA (Kamus Farmasi & Alkes) — SatuSehat.
 *
 * MOCK-FIRST: implementasi saat ini memfilter dataset lokal `KFA_MOCK` dengan
 * simulasi latensi. Signature & bentuk hasil sengaja menyerupai panggilan API
 * sungguhan agar saat backend siap cukup ganti body fungsi tanpa ubah UI.
 *
 * SWAP nanti → fetch ke BFF proxy internal, mis.:
 *   GET /api/v1/kfa/products?keyword=<q>&type=farmasi
 * yang meneruskan ke KFA v2 Kemenkes:
 *   GET {KFA_BASE}/products/all?product_type=farmasi&keyword=<q>&page=1&size=20
 *   Header: Authorization: Bearer <oauth2_token_satusehat>   (server-side)
 * Token OAuth2 SatuSehat WAJIB di server (jangan di klien).
 */

import type { KfaProduct } from "@/lib/master/kfaMock";
import { KFA_MOCK } from "@/lib/master/kfaMock";

const SIM_LATENCY_MS = 320;

/** Cari produk KFA berdasarkan keyword (nama produk / merk / zat aktif). */
export async function searchKfaProducts(
  keyword: string,
  signal?: AbortSignal,
): Promise<KfaProduct[]> {
  const q = keyword.trim().toLowerCase();
  if (q.length < 2) return [];

  await delay(SIM_LATENCY_MS, signal);

  return KFA_MOCK.filter((p) => {
    if (!p.active) return false;
    return (
      p.name.toLowerCase().includes(q) ||
      p.namaDagang?.toLowerCase().includes(q) ||
      p.productTemplate.name.toLowerCase().includes(q) ||
      p.activeIngredients.some((i) => i.zatAktif.toLowerCase().includes(q))
    );
  });
}

/** Sleep yang menghormati AbortSignal (lempar AbortError bila dibatalkan). */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
