// ANT2 — Mock katalog Pos Antrian → Loket untuk board admisi.
// Mock-first: CRUD pos & loket dikelola di ANT3 (Pengaturan). Saat backend ready
// → swap ke tabel `pos_antrian` / `loket`. UI board tidak berubah.

export interface LoketRef {
  kode: string;
  nama: string;
}

export interface PosAntrian {
  kode: string;
  nama: string;
  loket: LoketRef[];
}

export const POS_ANTRIAN: ReadonlyArray<PosAntrian> = [
  {
    kode: "RJ",
    nama: "Pendaftaran Rawat Jalan",
    loket: [
      { kode: "RJ-01", nama: "Loket 1" },
      { kode: "RJ-02", nama: "Loket 2" },
      { kode: "RJ-03", nama: "Loket 3" },
    ],
  },
  {
    kode: "BPJS",
    nama: "Pendaftaran BPJS",
    loket: [
      { kode: "BPJS-01", nama: "Loket BPJS 1" },
      { kode: "BPJS-02", nama: "Loket BPJS 2" },
    ],
  },
  {
    kode: "PRI",
    nama: "Loket Prioritas (Lansia / Disabilitas)",
    loket: [{ kode: "PRI-01", nama: "Loket Prioritas" }],
  },
];

// ── Helpers ────────────────────────────────────────────────

export function getPos(kode: string): PosAntrian | undefined {
  return POS_ANTRIAN.find((p) => p.kode === kode);
}

export function getLoket(posKode: string, loketKode: string): LoketRef | undefined {
  return getPos(posKode)?.loket.find((l) => l.kode === loketKode);
}

/** Label gabungan "Pendaftaran BPJS · Loket BPJS 1". */
export function loketLabel(posKode: string, loketKode: string): string {
  const pos = getPos(posKode);
  const loket = pos?.loket.find((l) => l.kode === loketKode);
  if (!pos || !loket) return "—";
  return `${pos.nama} · ${loket.nama}`;
}
