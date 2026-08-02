import type { Metadata } from "next";
import WilayahBrowser from "@/components/master/wilayah/WilayahBrowser";
import { wilayahService } from "@/lib/services/master/wilayahService";
import type { WilayahDTO } from "@/lib/schemas/master/wilayah";

export const metadata: Metadata = { title: "Wilayah Kemendagri — Master" };

// Referensi statis (di-seed) → boleh cache lama, tapi ikut pola master (fresh per request;
// cache-aside di Service saat Redis siap). API-RULES §6.1.
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint: provinsi (level 1, 38 baris) + stat jumlah per level. Level lebih dalam
  // dimuat CLIENT saat induk dipilih (lazy) — hindari muat 91k baris. Gagal → client refetch.
  let initialProvinces: WilayahDTO[] = [];
  let stats = { byLevel: {} as Record<number, number>, total: 0 };
  let prefetched = false;
  try {
    [initialProvinces, stats] = await Promise.all([
      wilayahService.list({ level: 1 }),
      wilayahService.stats(),
    ]);
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch saat mount */
  }

  return <WilayahBrowser initialProvinces={initialProvinces} stats={stats} prefetched={prefetched} />;
}
