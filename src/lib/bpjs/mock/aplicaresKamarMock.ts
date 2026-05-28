/**
 * Aplicares Kamar Mock (BP0.3).
 *
 * Derive `AplicaresKamarRecord[]` dari `RUANGAN_MOCK` master ruangan —
 * single source untuk bed availability. Tambah 3 ruangan synthetic
 * (Kelas_2, Kelas_3, HCU) untuk enrich variasi kelas BPJS.
 *
 * Mapping kelas RS → BPJS:
 * - Kelas_1 → "1"
 * - Kelas_2 → "2"
 * - Kelas_3 → "3"
 * - VIP    → "VIP"
 * - ICU/HCU/Isolasi → default "1" (intensive treatment ≈ K1)
 *
 * Status operasional (terisi/tersedia/kosong) di-derive dengan
 * okupansi synthetic deterministic per ruangan agar test stable.
 */

import type { AplicaresKamarRecord, KelasBPJSKode } from "../bpjsShared";
import {
  RUANGAN_MOCK,
  type LocationKelas,
  type LocationNode,
} from "@/components/master/ruangan/ruanganShared";

/** Map RS LocationKelas → BPJS KelasBPJSKode. */
function mapKelas(rsKelas: LocationKelas): KelasBPJSKode {
  switch (rsKelas) {
    case "VIP":
      return "VIP";
    case "Kelas_1":
      return "1";
    case "Kelas_2":
      return "2";
    case "Kelas_3":
      return "3";
    case "—":
    default:
      return "1"; // ICU/HCU/Isolasi default → kelas 1
  }
}

function kelasLabel(kdKelas: KelasBPJSKode): string {
  switch (kdKelas) {
    case "VIP":
      return "VIP";
    case "1":
      return "Kelas 1";
    case "2":
      return "Kelas 2";
    case "3":
      return "Kelas 3";
  }
}

/** Deterministic okupansi (% terisi) per kode ruang. 30-70%. */
function deterministicOccupancy(kodeRuang: string): number {
  let h = 0;
  for (let i = 0; i < kodeRuang.length; i++) h = (h * 31 + kodeRuang.charCodeAt(i)) >>> 0;
  return 0.3 + (h % 41) / 100; // 0.30 - 0.70
}

const SYNC_TIMESTAMP = "2026-05-28T10:00:00";

// ── Filter RUANGAN_MOCK → eligible inpatient locations ─

function isInpatientLocation(node: LocationNode): boolean {
  return (
    node.locationType === "Rawat_Inap" ||
    node.locationType === "ICU" ||
    node.locationType === "HCU" ||
    node.locationType === "Isolasi"
  );
}

const DERIVED_FROM_MASTER: AplicaresKamarRecord[] = RUANGAN_MOCK
  .filter((n): n is LocationNode => n.type === "Location" && isInpatientLocation(n))
  .filter((loc) => loc.beds.length > 0)
  .map((loc) => {
    const kdKelas = mapKelas(loc.kelas);
    const activeBeds = loc.beds.filter((b) => b.status === "active").length;
    const maintenanceBeds = loc.beds.filter((b) => b.status === "suspended").length;
    const inactiveBeds = loc.beds.filter((b) => b.status === "inactive").length;
    const occupancy = deterministicOccupancy(loc.kode);
    const terisi = Math.floor(activeBeds * occupancy);
    const tersedia = activeBeds - terisi;
    const kosong = inactiveBeds; // inactive = decommissioned dari bed pool

    return {
      kdKelas,
      namaKelas: kelasLabel(kdKelas),
      kapasitas: loc.kapasitas,
      tersedia,
      terisi,
      kosong,
      namaRuang: loc.name,
      kodeRuang: loc.kode,
      flagMaintenance: maintenanceBeds > 0,
      lastSyncISO: SYNC_TIMESTAMP,
    };
  });

// ── Synthetic Tambahan (enrich variasi kelas) ──────────

const SYNTHETIC_KAMAR: AplicaresKamarRecord[] = [
  {
    kdKelas: "2",
    namaKelas: "Kelas 2",
    kapasitas: 6,
    tersedia: 2,
    terisi: 4,
    kosong: 0,
    namaRuang: "Bangsal Anggrek (Kelas 2)",
    kodeRuang: "RI-ANG",
    lastSyncISO: SYNC_TIMESTAMP,
  },
  {
    kdKelas: "3",
    namaKelas: "Kelas 3",
    kapasitas: 12,
    tersedia: 5,
    terisi: 7,
    kosong: 0,
    namaRuang: "Bangsal Cendrawasih (Kelas 3)",
    kodeRuang: "RI-CND",
    lastSyncISO: SYNC_TIMESTAMP,
  },
  {
    kdKelas: "1",
    namaKelas: "Kelas 1",
    kapasitas: 4,
    tersedia: 1,
    terisi: 3,
    kosong: 0,
    namaRuang: "Ruang HCU",
    kodeRuang: "RI-HCU",
    lastSyncISO: SYNC_TIMESTAMP,
  },
];

export const APLICARES_KAMAR_MOCK: ReadonlyArray<AplicaresKamarRecord> = [
  ...DERIVED_FROM_MASTER,
  ...SYNTHETIC_KAMAR,
];

// ── Lookup Helpers ─────────────────────────────────────

export function findKamarByKode(kodeRuang: string): AplicaresKamarRecord | undefined {
  return APLICARES_KAMAR_MOCK.find((k) => k.kodeRuang === kodeRuang);
}

export function listKamarByKelas(kdKelas: KelasBPJSKode): AplicaresKamarRecord[] {
  return APLICARES_KAMAR_MOCK.filter((k) => k.kdKelas === kdKelas);
}

/** Total kapasitas + okupansi global untuk KPI strip. */
export function aggregateKamarKPI(): {
  totalKapasitas: number;
  totalTersedia: number;
  totalTerisi: number;
  totalKosong: number;
} {
  return APLICARES_KAMAR_MOCK.reduce(
    (acc, k) => ({
      totalKapasitas: acc.totalKapasitas + k.kapasitas,
      totalTersedia: acc.totalTersedia + k.tersedia,
      totalTerisi: acc.totalTerisi + k.terisi,
      totalKosong: acc.totalKosong + k.kosong,
    }),
    { totalKapasitas: 0, totalTersedia: 0, totalTerisi: 0, totalKosong: 0 },
  );
}
