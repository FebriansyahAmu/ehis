// Zona regio anatomis untuk Penandaan Gambar — dikalibrasi ke CITRA anatomi nyata
// (/public/anatomy, anterior, posisi anatomis). Koordinat dalam PERSEN terhadap citra
// (0–100) agar presisi mengikuti ukuran tampil. Dipakai untuk deteksi regio otomatis
// saat menandai (pin) atau menggambar (centroid coretan) → label regio + sisi pasien.
//
// Konvensi sisi (anterior): kiri-citra = KANAN pasien, kanan-citra = KIRI pasien.

export interface ChartRegion {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** sisi citra: kiri / kanan / tengah */
  side: "L" | "R" | "C";
  /** nama dasar regio (tanpa sisi) */
  nama: string;
}

type ZoneTpl = Omit<ChartRegion, "key"> & { key: string };

// Template zona (sisi-kiri citra "L" + tengah "C"); sisi kanan di-generate via mirror.
// Urutan = prioritas deteksi (ekstremitas & sub-regio kecil lebih dulu, badan besar terakhir).
const ZONES: ZoneTpl[] = [
  { key: "kepala", side: "C", x: 43, y: 2, w: 14, h: 10, nama: "Kepala / Wajah" },
  { key: "leher", side: "C", x: 45, y: 12, w: 10, h: 3.5, nama: "Leher" },
  { key: "tangan", side: "L", x: 12, y: 43, w: 13, h: 11, nama: "Tangan" },
  { key: "lengan-bawah", side: "L", x: 18, y: 30, w: 12, h: 13, nama: "Lengan Bawah" },
  { key: "lengan-atas", side: "L", x: 24, y: 17, w: 12, h: 13, nama: "Lengan Atas" },
  { key: "bahu", side: "L", x: 27, y: 14, w: 12, h: 6, nama: "Bahu" },
  { key: "kaki", side: "L", x: 37, y: 88, w: 14, h: 10, nama: "Kaki" },
  { key: "tungkai", side: "L", x: 38, y: 67, w: 12, h: 21, nama: "Tungkai Bawah" },
  { key: "paha", side: "L", x: 37, y: 50, w: 13, h: 17, nama: "Paha" },
  { key: "dada", side: "L", x: 37, y: 15.5, w: 13, h: 12.5, nama: "Dada" },
  { key: "pelvis", side: "C", x: 39, y: 41, w: 22, h: 9, nama: "Pelvis / Inguinal" },
  { key: "abdomen", side: "C", x: 38, y: 28, w: 24, h: 13, nama: "Abdomen" },
];

function expand(zones: ZoneTpl[]): ChartRegion[] {
  const out: ChartRegion[] = [];
  for (const z of zones) {
    if (z.side === "C") {
      out.push(z);
      continue;
    }
    out.push(z); // kiri citra
    out.push({ ...z, key: `${z.key}-R`, x: 100 - z.x - z.w, side: "R" }); // kanan citra (mirror)
  }
  return out;
}

export const BODY_REGIONS: ChartRegion[] = expand(ZONES);

/** Label regio + sisi pasien (anterior). */
export function regionLabel(rg: ChartRegion): string {
  if (rg.side === "C") return rg.nama;
  // anterior: kiri-citra = KANAN pasien
  return `${rg.nama} ${rg.side === "L" ? "Kanan" : "Kiri"}`;
}

/** Regio pada koordinat % (zona pertama yang memuat titik, urut prioritas). */
export function regionAt(xPct: number, yPct: number): string {
  const hit = BODY_REGIONS.find(
    (rg) => xPct >= rg.x && xPct <= rg.x + rg.w && yPct >= rg.y && yPct <= rg.y + rg.h,
  );
  return hit ? regionLabel(hit) : "Regio Tubuh";
}
