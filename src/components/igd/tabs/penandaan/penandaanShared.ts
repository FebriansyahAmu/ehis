// Shared types + config untuk Penandaan Gambar 3D (status lokalis).
// Dipakai oleh: PenandaanGambarTab (orchestrator) · Viewer3D · HumanModel · PenandaanPanels · OdontogramChart.

// ── Severitas ─────────────────────────────────────────────

export type Severitas = "Normal" | "Ringan" | "Sedang" | "Berat" | "Trauma";

export const SEV_ORDER: Severitas[] = [
  "Normal",
  "Ringan",
  "Sedang",
  "Berat",
  "Trauma",
];

export interface SevStyle {
  bg: string;
  text: string;
  ring: string;
  dot: string;
  pinBg: string;
  border: string;
  /** warna hex untuk material marker 3D */
  hex: string;
}

export const SEV: Record<Severitas, SevStyle> = {
  Normal: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
    pinBg: "bg-emerald-500",
    border: "border-emerald-200",
    hex: "#10b981",
  },
  Ringan: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
    dot: "bg-sky-500",
    pinBg: "bg-sky-500",
    border: "border-sky-200",
    hex: "#0ea5e9",
  },
  Sedang: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
    pinBg: "bg-amber-500",
    border: "border-amber-200",
    hex: "#f59e0b",
  },
  Berat: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
    dot: "bg-rose-500",
    pinBg: "bg-rose-600",
    border: "border-rose-200",
    hex: "#e11d48",
  },
  Trauma: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    ring: "ring-orange-200",
    dot: "bg-orange-500",
    pinBg: "bg-orange-600",
    border: "border-orange-200",
    hex: "#ea580c",
  },
};

// ── Model & mode ──────────────────────────────────────────

export type ModelJenis = "dewasa" | "anak";

/** Mode kanvas aktif: model 3D atau odontogram 2D (chart FDI memang standar 2D). */
export type KanvasMode = ModelJenis | "gigi";

export type ViewPresetId = "depan" | "belakang" | "kepala";

export const VIEW_PRESETS: { id: ViewPresetId; label: string }[] = [
  { id: "depan", label: "Depan" },
  { id: "belakang", label: "Belakang" },
  { id: "kepala", label: "Kepala & Leher" },
];

export const MODEL_LABEL: Record<KanvasMode, string> = {
  dewasa: "Dewasa",
  anak: "Anak",
  gigi: "Odontogram",
};

// ── Anotasi ───────────────────────────────────────────────

export interface Anotasi {
  id: string;
  /** kanvas tempat anotasi dibuat */
  mode: KanvasMode;
  /** posisi lokal model 3D (tetap menempel saat model dirotasi) — null untuk gigi */
  pos3d: [number, number, number] | null;
  /** koordinat % untuk odontogram 2D — null untuk 3D */
  koordinat2d: { x: number; y: number } | null;
  /** regio anatomis hasil deteksi raycast (mis. "Lengan Bawah Kiri") */
  region: string;
  label: string;
  deskripsi: string;
  severitas: Severitas;
  createdAt: string;
}

/** Payload klik pada tubuh 3D sebelum jadi anotasi. */
export interface PendingMark {
  mode: KanvasMode;
  pos3d: [number, number, number] | null;
  koordinat2d: { x: number; y: number } | null;
  region: string;
}
