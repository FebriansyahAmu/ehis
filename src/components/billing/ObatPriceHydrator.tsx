"use client";

import { useEffect } from "react";
import { setObatPriceCatalog, type ObatPriceEntry } from "@/lib/billing/obatPriceCatalog";

/**
 * Hydrate snapshot harga obat (client) dari data SSR layout billing → dipakai
 * `priceResolver.getHargaObat` (sinkron). Render null.
 */
export default function ObatPriceHydrator({ entries }: { entries: ObatPriceEntry[] }) {
  useEffect(() => {
    setObatPriceCatalog(entries);
  }, [entries]);
  return null;
}
