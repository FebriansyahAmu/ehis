/**
 * Berkas Generator — shared types, template config, print + download helpers (EK5).
 *
 * Print strategy: `printElementById` injects a @media print style that hides
 * everything except the target element using CSS visibility (not display:none),
 * so React-rendered content in a fixed off-screen div prints cleanly.
 *
 * Bundle strategy: mock JSON manifest (real impl = ZIP via JSZip or server action).
 */

import { FileSignature, FolderCheck, FileText, type LucideIcon } from "lucide-react";
import type { ClaimRecord, Gender, TipePelayanan, CaraPulang } from "@/lib/eklaim/eklaimShared";

// ── Template Config ────────────────────────────────────

export type TemplateKey = "resume-medis" | "berkas-klaim" | "surat-pengantar";

export interface TemplateCfg {
  key: TemplateKey;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  /** Tailwind gradient bg classes. */
  fromBg: string;
  toBg: string;
  ringActive: string;
  textActive: string;
  iconBg: string;
  description: string;
}

export const TEMPLATE_CFG: ReadonlyArray<TemplateCfg> = [
  {
    key: "resume-medis",
    label: "Resume Medis",
    sublabel: "DPJP · Coder RM · Verifikator",
    icon: FileSignature,
    fromBg: "from-teal-50",
    toBg: "to-teal-100/60",
    ringActive: "ring-teal-400",
    textActive: "text-teal-800",
    iconBg: "bg-teal-100 text-teal-700",
    description:
      "Ringkasan pelayanan medis: identitas pasien, diagnosa ICD-10-IM, prosedur ICD-9-CM-IM, hasil grouper iDRG, riwayat anamnesis, dan tanda tangan DPJP + Coder RM.",
  },
  {
    key: "berkas-klaim",
    label: "Berkas Klaim",
    sublabel: "Cover Sheet · Checklist Lengkap",
    icon: FolderCheck,
    fromBg: "from-sky-50",
    toBg: "to-sky-100/60",
    ringActive: "ring-sky-400",
    textActive: "text-sky-800",
    iconBg: "bg-sky-100 text-sky-700",
    description:
      "Cover sheet klaim berisi daftar kelengkapan berkas, status setiap dokumen, hasil grouper iDRG, dan tanda tangan coder + verifikator RS.",
  },
  {
    key: "surat-pengantar",
    label: "Surat Pengantar",
    sublabel: "Pengiriman Batch ke BPJS",
    icon: FileText,
    fromBg: "from-emerald-50",
    toBg: "to-emerald-100/60",
    ringActive: "ring-emerald-400",
    textActive: "text-emerald-800",
    iconBg: "bg-emerald-100 text-emerald-700",
    description:
      "Surat formal pengantar pengiriman batch klaim ke BPJS Kesehatan, berisi daftar klaim ringkas dan tanda tangan Kepala Tim Klaim.",
  },
];

// ── Display Helpers ────────────────────────────────────

export function fmtGender(g: Gender): string {
  return g === "L" ? "Laki-laki" : "Perempuan";
}

export function fmtTipePelayanan(t: TipePelayanan): string {
  if (t === "RI") return "Rawat Inap";
  if (t === "RJ") return "Rawat Jalan";
  return "Same Day Care";
}

export function fmtCaraPulang(c: CaraPulang): string {
  const map: Record<CaraPulang, string> = {
    Sembuh: "Sembuh / Pulang Sehat",
    PulangAPS: "Pulang Atas Permintaan Sendiri",
    Rujuk: "Dirujuk ke Faskes Lain",
    Meninggal: "Meninggal Dunia",
  };
  return map[c];
}

export function fmtDateLong(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function fmtDateShortDoc(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function todayLong(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function todayShort(): string {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function currentMonthYear(): string {
  return new Date().toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

// ── Print Helper ───────────────────────────────────────

/**
 * Trigger browser print for a specific DOM element.
 *
 * Strategy: inject a @media print style that hides everything via `visibility:hidden`
 * then restores only the target element to `visibility:visible`. Uses `position:fixed`
 * to position the element at page origin during print.
 *
 * The target element must be rendered in DOM (not display:none). Use
 * `position:fixed; left:-99999px` to keep it off-screen on normal view.
 */
export function printElementById(elementId: string): void {
  const styleId = "__eklaim-print-override";
  document.getElementById(styleId)?.remove();

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = [
    "@media print {",
    "  @page { size: A4 portrait; margin: 0; }",
    "  * { visibility: hidden !important; }",
    `  #${elementId}, #${elementId} * { visibility: visible !important; }`,
    `  #${elementId} {`,
    "    position: fixed !important;",
    "    left: 0 !important;",
    "    top: 0 !important;",
    "    width: 210mm !important;",
    "    margin: 0 !important;",
    "    padding: 0 !important;",
    "  }",
    "}",
  ].join("\n");
  document.head.appendChild(style);

  window.print();
  window.addEventListener(
    "afterprint",
    () => document.getElementById(styleId)?.remove(),
    { once: true },
  );
}

// ── Mock Bundle Download ───────────────────────────────

/**
 * Generate + download a mock bundle manifest (JSON simulating ZIP).
 * Real impl: JSZip or server action collecting PDF blobs.
 */
export function downloadBerkasBundle(claim: ClaimRecord): void {
  const manifest = {
    generated: new Date().toISOString(),
    noKlaim: claim.noKlaim,
    pasienId: claim.pasienId,
    penjamin: claim.penjamin.nama,
    tipePelayanan: claim.tipePelayanan,
    eraGrouper: claim.eraGrouper,
    idrgCode: claim.iDRG?.code ?? null,
    cbgCode: claim.inaCbgLegacy?.code ?? null,
    berkas: claim.berkas.map((b) => ({
      id: b.id,
      kategori: b.kategori,
      nama: b.nama,
      wajib: b.wajib,
      status: b.status,
      fileUrl: b.file?.url ?? null,
    })),
    templates: [
      "01-resume-medis.pdf",
      "02-berkas-klaim-cover.pdf",
      "03-surat-pengantar.pdf",
    ],
    _note: "Mock bundle — implementasi nyata menggunakan ZIP via server action.",
  };

  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bundle-${claim.noKlaim}-${todayShort().replace(/\//g, "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
