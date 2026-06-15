// Shared types + config untuk Penandaan Gambar (status lokalis).
// Bagan anatomi = citra PNG nyata per jenis kelamin (anterior) + odontogram FDI.
// Penanda: Pin (titik) & Draw (coretan area) + keterangan. Dipakai oleh: PenandaanGambarTab
// (orchestrator) · BodyMap2D · bodyChart (zona regio) · PenandaanPanels · OdontogramChart.

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

/** Bagan tubuh = citra anatomi nyata per jenis kelamin (anterior). Anak ditunda. */
export type ModelJenis = "pria" | "wanita";

/** Mode kanvas aktif: bagan tubuh (pria/wanita) atau odontogram FDI. */
export type KanvasMode = ModelJenis | "gigi";

/** Aset citra anatomi (PNG transparan, anterior, 1500×2100) di /public/anatomy. */
export const ANATOMY_SRC: Record<ModelJenis, string> = {
  pria: "/anatomy/Human-anatomy-mele.png",
  wanita: "/anatomy/Human-anatomy-female.png",
};

/** Rasio asli citra → dipakai untuk aspectRatio kanvas (agar % koordinat presisi). */
export const ANATOMY_W = 1500;
export const ANATOMY_H = 2100;

export const MODEL_LABEL: Record<KanvasMode, string> = {
  pria: "Laki-laki",
  wanita: "Perempuan",
  gigi: "Odontogram",
};

/** Alat penandaan pada bagan tubuh: titik (pin) atau gambar bebas (draw). */
export type AnnTool = "pin" | "draw";

/** kunjungan nyata (UUID) → persist ke DB; mock seed (mis. igd-1) → demo lokal. */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Anotasi ───────────────────────────────────────────────

export interface Anotasi {
  id: string;
  /** kanvas tempat anotasi dibuat */
  mode: KanvasMode;
  /** jenis penanda: titik atau coretan area */
  kind: AnnTool;
  /** koordinat % terhadap citra (x,y) — titik pin, atau jangkar label untuk coretan */
  koordinat2d: { x: number; y: number } | null;
  /** jalur coretan (deret titik %) untuk kind "draw" — null untuk pin */
  path: { x: number; y: number }[] | null;
  /** regio anatomis hasil deteksi zona (mis. "Lengan Bawah Kiri") */
  region: string;
  label: string;
  deskripsi: string;
  severitas: Severitas;
  createdAt: string;
}

/** Payload klik / coretan pada bagan sebelum jadi anotasi. */
export interface PendingMark {
  mode: KanvasMode;
  kind: AnnTool;
  koordinat2d: { x: number; y: number } | null;
  path: { x: number; y: number }[] | null;
  region: string;
}
