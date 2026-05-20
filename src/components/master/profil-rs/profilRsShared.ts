import { Building2, MapPin, ShieldCheck, Clock, FileText, type LucideIcon } from "lucide-react";

export type SectionKey = "identitas" | "alamat" | "akreditasi" | "shift" | "kop";

export interface SectionConfig {
  key:    SectionKey;
  label:  string;
  desc:   string;
  icon:   LucideIcon;
  accent: { bg: string; text: string; ring: string };
}

export const SECTION_REGISTRY: readonly SectionConfig[] = [
  {
    key:    "identitas",
    label:  "Identitas RS",
    desc:   "Nama, kode, kelas, tipe, kepemilikan, kontak",
    icon:   Building2,
    accent: { bg: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-200"    },
  },
  {
    key:    "alamat",
    label:  "Alamat & Lokasi",
    desc:   "Jalan, kelurahan, kecamatan, kota, kode wilayah",
    icon:   MapPin,
    accent: { bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200"     },
  },
  {
    key:    "akreditasi",
    label:  "Akreditasi & Izin",
    desc:   "Nomor izin, KARS/JCI, sertifikat, masa berlaku",
    icon:   ShieldCheck,
    accent: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  },
  {
    key:    "shift",
    label:  "Konfigurasi Shift",
    desc:   "Jam kerja Pagi · Siang · Malam (dipakai seluruh modul)",
    icon:   Clock,
    accent: { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200"   },
  },
  {
    key:    "kop",
    label:  "KOP Surat",
    desc:   "Header resmi pada dokumen cetak RS",
    icon:   FileText,
    accent: { bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200"  },
  },
] as const;

export function getSectionCfg(key: SectionKey): SectionConfig {
  return SECTION_REGISTRY.find((s) => s.key === key)!;
}
