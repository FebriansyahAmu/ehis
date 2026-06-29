// Shared helpers landing Rawat Inap (census + informasi tempat tidur) — DB-driven.
// Menurunkan kelas ruangan, status okupansi bed, dan konfigurasi tampilan dari master
// (LocationNode RI) + alokasi bed aktif (BedAllocationDTO). Tanpa data mock.

import type { LucideIcon } from "lucide-react";
import { Activity, HeartPulse, ShieldAlert, Crown, Star, BedDouble, Users } from "lucide-react";
import type { LocationNode } from "@/components/master/ruangan/ruanganShared";
import type { BedAllocationDTO } from "@/lib/api/bedAllocation";
import type { RIKelas, RIPenjamin } from "@/lib/data";

/** Location types yang dianggap "rawat inap". */
export const RI_LOCATION_TYPES = new Set(["Rawat_Inap", "ICU", "HCU", "Isolasi"]);

export type BedState = "available" | "occupied" | "reserved" | "inactive";

export interface BedItem {
  bed: LocationNode["beds"][number];
  room: LocationNode;
  kelas: RIKelas;
  state: BedState;
  alloc?: BedAllocationDTO;
}

/** Kelas efektif sebuah ruangan RI: ICU/HCU/Isolasi dari tipe; selain itu dari `kelas` master. */
export function riKelasOf(room: LocationNode): RIKelas {
  if (room.locationType === "ICU") return "ICU";
  if (room.locationType === "HCU") return "HCU";
  if (room.locationType === "Isolasi") return "Isolasi";
  return room.kelas === "—" ? "Kelas_3" : (room.kelas as RIKelas);
}

/** Filter tree → ruangan RI saja (punya bed). */
export function riRoomsFromTree(tree: { type: string }[]): LocationNode[] {
  return (tree as LocationNode[]).filter(
    (n) => n.type === "Location" && RI_LOCATION_TYPES.has(n.locationType),
  );
}

/** Susun daftar bed RI + status okupansi (gabung master bed × alokasi aktif). */
export function buildBedItems(rooms: LocationNode[], allocByBed: Map<string, BedAllocationDTO>): BedItem[] {
  const items: BedItem[] = [];
  for (const room of rooms) {
    const kelas = riKelasOf(room);
    for (const bed of room.beds) {
      const alloc = allocByBed.get(bed.id);
      const state: BedState =
        bed.status !== "active"
          ? "inactive"
          : alloc?.status === "Occupied"
            ? "occupied"
            : alloc?.status === "Reserved"
              ? "reserved"
              : "available";
      items.push({ bed, room, kelas, state, alloc });
    }
  }
  return items;
}

export interface BedCounts {
  total: number;
  occupied: number;
  reserved: number;
  available: number;
  inactive: number;
  /** Bed aktif (total − nonaktif) — basis BOR. */
  active: number;
  /** % okupansi = terisi / bed aktif. */
  bor: number;
}

export function countBeds(items: BedItem[]): BedCounts {
  const occupied = items.filter((b) => b.state === "occupied").length;
  const reserved = items.filter((b) => b.state === "reserved").length;
  const available = items.filter((b) => b.state === "available").length;
  const inactive = items.filter((b) => b.state === "inactive").length;
  const active = items.length - inactive;
  return {
    total: items.length,
    occupied, reserved, available, inactive, active,
    bor: active === 0 ? 0 : Math.round((occupied / active) * 100),
  };
}

// ── Konfigurasi tampilan per-kelas ───────────────────────────────────────────
export interface KelasCfg {
  label: string;
  icon: LucideIcon;
  header: string; // bg solid (header modal / chip)
  soft: string;   // bg lembut (chip ringkasan)
  text: string;
  pulse?: boolean;
}

export const RI_KELAS_CFG: Record<RIKelas, KelasCfg> = {
  ICU:     { label: "ICU",     icon: Activity,    header: "bg-rose-600",   soft: "bg-rose-50 ring-rose-100",     text: "text-rose-700",   pulse: true },
  HCU:     { label: "HCU",     icon: HeartPulse,  header: "bg-amber-500",  soft: "bg-amber-50 ring-amber-100",   text: "text-amber-700",  pulse: true },
  Isolasi: { label: "Isolasi", icon: ShieldAlert, header: "bg-teal-600",   soft: "bg-teal-50 ring-teal-100",     text: "text-teal-700"  },
  VIP:     { label: "VIP",     icon: Crown,       header: "bg-violet-600", soft: "bg-violet-50 ring-violet-100", text: "text-violet-700" },
  Kelas_1: { label: "Kelas 1", icon: Star,        header: "bg-indigo-600", soft: "bg-indigo-50 ring-indigo-100", text: "text-indigo-700" },
  Kelas_2: { label: "Kelas 2", icon: BedDouble,   header: "bg-sky-600",    soft: "bg-sky-50 ring-sky-100",       text: "text-sky-700"   },
  Kelas_3: { label: "Kelas 3", icon: Users,       header: "bg-slate-500",  soft: "bg-slate-100 ring-slate-200",  text: "text-slate-600" },
};

export const RI_KELAS_ORDER: RIKelas[] = ["ICU", "HCU", "Isolasi", "VIP", "Kelas_1", "Kelas_2", "Kelas_3"];

export const RI_PENJAMIN_LABEL: Record<RIPenjamin, string> = {
  BPJS_PBI: "BPJS PBI", BPJS_Non_PBI: "BPJS Non-PBI",
  Umum: "Umum", Asuransi: "Asuransi", Jamkesda: "Jamkesda",
};

/** Map tipe penjamin kunjungan (TipePenjamin) → RIPenjamin (sama domain). */
export function toRIPenjamin(tipe: string): RIPenjamin {
  switch (tipe) {
    case "BPJS_PBI": return "BPJS_PBI";
    case "BPJS_Non_PBI": return "BPJS_Non_PBI";
    case "Asuransi": return "Asuransi";
    case "Jamkesda": return "Jamkesda";
    default: return "Umum";
  }
}

/** Umur dari tanggal lahir ISO (YYYY-MM-DD). 0 bila tak ada. */
export function ageFrom(tglLahirIso: string | null): number {
  if (!tglLahirIso) return 0;
  const d = new Date(tglLahirIso);
  if (Number.isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

/** Hari ke-N rawat (selisih tanggal kalender admit→hari ini, inklusif). */
export function hariKeFrom(admitIso: string): number {
  const a = new Date(admitIso);
  if (Number.isNaN(a.getTime())) return 1;
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const t = new Date();
  const t0 = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.max(1, Math.round((t0.getTime() - a0.getTime()) / (24 * 3600 * 1000)) + 1);
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
