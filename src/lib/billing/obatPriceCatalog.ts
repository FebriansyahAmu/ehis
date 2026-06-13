/**
 * Snapshot harga obat untuk resolusi billing (client).
 *
 * Dulu `priceResolver.getHargaObat` membaca OBAT_MOCK langsung. Setelah katalog
 * obat pindah ke DB (master.obat), snapshot ini di-hydrate sekali dari API saat
 * modul billing mount (lihat `ObatPriceHydrator` di layout billing). Resolver +
 * adapter tetap sinkron (kontrak tak berubah); sebelum hydrate → lookup mengembalikan
 * null (caller pakai fallback). SWAP ke cache server/Redis: cukup ganti sumber hydrate.
 */

export interface ObatPriceEntry {
  id: string;
  kode: string;
  namaGenerik: string;
  namaDagang: string;
  hargaSatuan: number;
}

let _catalog: ObatPriceEntry[] = [];

export function setObatPriceCatalog(list: ObatPriceEntry[]): void {
  _catalog = list;
}

/** Lookup harga by kode (preferred) atau nama generik/dagang (fuzzy). */
export function lookupObatPrice(kodeOrNama: string): ObatPriceEntry | null {
  const q = kodeOrNama.toLowerCase().trim();
  if (!q) return null;
  const byKode = _catalog.find((o) => o.kode.toLowerCase() === q);
  if (byKode) return byKode;
  return (
    _catalog.find(
      (o) =>
        o.namaGenerik.toLowerCase() === q ||
        o.namaDagang.toLowerCase() === q ||
        o.namaGenerik.toLowerCase().includes(q) ||
        q.includes(o.namaGenerik.toLowerCase()),
    ) ?? null
  );
}
