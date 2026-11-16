// cn() untuk primitif shadcn/ui (src/components/ui/*) — clsx + tailwind-merge.
//
// Komponen shadcn butuh MERGE (bukan sekadar gabung string): `className` dari pemakai harus bisa
// menimpa default varian (mis. `h-9` → `h-8`). `cn()` lama di src/lib/utils.ts hanya menggabung
// string dan SENGAJA tidak diubah (dipakai ±2.000 file; mengganti perilakunya tanpa uji visual
// berisiko). Lihat docs/ENGINEERING-RULES.md §4 (U6).
//
// Utilitas density EHIS `m-mini … m-lg` (font-size, globals.css) didaftarkan sebagai grup sendiri:
// tidak bentrok dengan margin `m-*` maupun `text-*`; antar-density → yang terakhir menang.

import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge<"ehis-density">({
  extend: {
    classGroups: {
      "ehis-density": [{ m: ["mini", "tiny", "xs", "sm", "base", "lg"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
