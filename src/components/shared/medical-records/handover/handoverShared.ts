// Types, constants, helpers, dan mock untuk Handover (Serah Terima Shift) — versi COMPACT.
// Pengisian diringkas: 1 field konsolidasi per huruf SBAR (S/B/A/R) + meta minimal.
// Perawat keluar = sesi login (otomatis). Penerima distempel saat aksi "Terima" (closed-loop).
// Warna: tanpa ungu/indigo (sky-first).

// ── Shared patient interface ──────────────────────────────

export interface HandoverPatient {
  id: string; // kunjunganId — UUID = persist ke DB; non-UUID (demo) = lokal saja
  name: string;
  noRM: string;
  subtitle: string; // dibangun caller (mis. "diagnosa · Hari ke-3 · Anggrek 201B")
  badge?: string; // DPJP / dokter
}

// kunjungan riil = UUID (persist) vs pasien demo (mock) → lokal saja (selaras penandaan).
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Shift types ───────────────────────────────────────────

export type Shift = "Pagi" | "Siang" | "Malam";
export const SHIFTS: Shift[] = ["Pagi", "Siang", "Malam"];

export const SHIFT_CONFIG: Record<
  Shift,
  {
    jam: string;
    activeBg: string;
    activeBorder: string;
    activeText: string;
    badge: string;
    dot: string;
    ring: string;
  }
> = {
  Pagi: {
    jam: "07:00",
    activeBg: "bg-sky-500",
    activeBorder: "border-sky-500",
    activeText: "text-white",
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-400",
    ring: "ring-sky-200",
  },
  Siang: {
    jam: "14:00",
    activeBg: "bg-amber-500",
    activeBorder: "border-amber-500",
    activeText: "text-white",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
    ring: "ring-amber-200",
  },
  Malam: {
    jam: "21:00",
    activeBg: "bg-slate-600", // malam → tema gelap (bukan ungu/indigo)
    activeBorder: "border-slate-600",
    activeText: "text-white",
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
    ring: "ring-slate-200",
  },
};

// 4 huruf SBAR — tiap huruf = 1 field konsolidasi. Warna distinct & non-ungu.
export const SBAR_DEF = [
  {
    key: "S" as const,
    label: "Situation",
    desc: "Kondisi & keluhan aktif pasien",
    border: "border-sky-200",
    bg: "bg-sky-50",
    text: "text-sky-700",
    badge: "bg-sky-100 text-sky-700",
    ring: "ring-sky-200",
    placeholder: "Kesadaran, kondisi umum, keluhan yang masih dirasakan…",
  },
  {
    key: "B" as const,
    label: "Background",
    desc: "Tindakan & obat shift ini",
    border: "border-cyan-200",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    badge: "bg-cyan-100 text-cyan-700",
    ring: "ring-cyan-200",
    placeholder: "Tindakan keperawatan & obat yang sudah diberikan shift ini…",
  },
  {
    key: "A" as const,
    label: "Assessment",
    desc: "Masalah aktif & perubahan kondisi",
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    ring: "ring-amber-200",
    placeholder: "Masalah keperawatan/medis aktif & perubahan kondisi signifikan…",
  },
  {
    key: "R" as const,
    label: "Recommendation",
    desc: "Instruksi & hal yang harus dipantau",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    ring: "ring-emerald-200",
    placeholder: "Order/instruksi pending & parameter yang dipantau shift berikutnya…",
  },
] as const;

export type SBARItem = (typeof SBAR_DEF)[number];

// ── Data types ────────────────────────────────────────────

export interface HandoverEntry {
  id: string;
  tanggal: string; // "2026-05-14" ISO
  shift: Shift;
  jamSerahTerima: string; // "07:12"
  perawatKeluar: string; // pemberi (sesi login saat menyusun)
  perawatMasuk: string; // penerima — "" = belum diterima (diisi saat aksi "Terima")
  jamTerima?: string; // "07:20" — waktu serah terima diterima penerima
  // SBAR — 1 field konsolidasi per huruf
  situation: string; // S
  background: string; // B — tindakan & obat
  assessment: string; // A
  recommendation: string; // R
}

// ── Date helpers ──────────────────────────────────────────

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function prevDay(iso: string): string {
  const d = new Date(iso);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function nextDay(iso: string): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Mock data (ringkas: 4 field SBAR) ─────────────────────

export const HANDOVER_MOCK: Record<string, HandoverEntry[]> = {
  // Rawat Inap — RM-2025-003 (Joko Santoso, GJK)
  "RM-2025-003": [
    {
      id: "ho-001",
      tanggal: "2026-05-13",
      shift: "Pagi",
      jamSerahTerima: "07:12",
      perawatKeluar: "Ns. Dewi Rahayu",
      perawatMasuk: "Ns. Rina Sari",
      jamTerima: "07:18",
      situation:
        "Sadar penuh, composmentis, posisi semi-Fowler 30°. Sesak berkurang dibanding semalam, masih sesak ringan saat berbaring datar; tidak ada nyeri dada aktif.",      background:
        "IV line, nebulisasi salbutamol 2×, monitoring TTV tiap 4 jam, balance cairan. Obat: Furosemid 40mg IV (05:00), Spironolakton 25mg PO, Bisoprolol 2.5mg PO (06:00).",
      assessment:
        "Kelebihan volume cairan — edema tungkai +2; pola napas membaik. SpO₂ 93%→96% pasca nebulisasi, urine output 600ml shift malam.",
      recommendation:
        "Rontgen thorax 08:00 (tunggu hasil sebelum konsul kardiologi). Pantau balance cairan ketat (UO ≥0.5ml/kgBB/jam), SpO₂ >95%. Pending: ambil darah BNP + elektrolit 07:30.",
    },
    {
      id: "ho-002",
      tanggal: "2026-05-13",
      shift: "Siang",
      jamSerahTerima: "14:05",
      perawatKeluar: "Ns. Rina Sari",
      perawatMasuk: "Ns. Budi Santoso",
      jamTerima: "14:11",
      situation:
        "Sadar, tenang, sesak minimal. Makan siang habis setengah porsi. Kaki masih bengkak tapi berkurang; lebih nyaman saat duduk.",      background:
        "Rontgen thorax selesai, konsul Sp.GIZ (rencana diet rendah garam 2g/hari). Obat: Furosemid 40mg IV (12:00), Ramipril 5mg PO (13:00); MAR lengkap.",
      assessment:
        "Kelebihan volume cairan membaik, edema +1. Risiko jatuh sedang (Morse 45). BNP turun 890→720 pg/mL; mulai mobilisasi bertahap.",
      recommendation:
        "DPJP visit 16:00 — siapkan lab BNP+elektrolit+rontgen. Pantau edema pagi-sore, restriksi cairan 1500ml/hari. Pending: kaus kaki antiemboli sebelum 18:00.",
    },
    {
      id: "ho-003",
      tanggal: "2026-05-13",
      shift: "Malam",
      jamSerahTerima: "21:08",
      perawatKeluar: "Ns. Budi Santoso",
      perawatMasuk: "Ns. Yanti Putri",
      jamTerima: "21:14",
      situation:
        "Sadar, rileks, edema tungkai membaik signifikan. Tidak ada keluhan aktif; tidur nyenyak sejak 20:00.",      background:
        "Visit DPJP 16:30 — advis lanjutkan terapi, rencana KRS besok bila stabil. Semua obat malam diberikan sesuai MAR, tidak ada yang tertunda.",
      assessment:
        "Volume cairan mendekati normal, kondisi stabil menjelang KRS. DPJP berencana KRS besok pagi.",
      recommendation:
        "Siapkan resume medis + surat pulang, edukasi pasien+keluarga 08:00. Pantau TTV pagi. Pending: koordinasi obat pulang farmasi, booking kontrol poli jantung.",
    },
    {
      id: "ho-004",
      tanggal: "2026-05-14",
      shift: "Pagi",
      jamSerahTerima: "07:09",
      perawatKeluar: "Ns. Yanti Putri",
      perawatMasuk: "Ns. Dewi Rahayu",
      jamTerima: "07:15",
      situation:
        "Sadar, semangat, menanyakan jadwal pulang. Tidak ada keluhan; minta izin mandi & bersiap pulang.",      background:
        "Aff IV line, edukasi pasien & keluarga (obat pulang + jadwal kontrol). Obat pagi: Bisoprolol 2.5mg, Ramipril 5mg, Spironolakton 25mg.",
      assessment:
        "Kondisi stabil, parameter klinis dalam batas normal. Rencana KRS hari ini setelah resume medis ditandatangani DPJP.",
      recommendation:
        "DPJP datang 10:00 untuk TTD resume + surat pulang. Pastikan kelengkapan dokumen pulang. Pending: clearance billing, obat pulang dari farmasi.",
    },
  ],

  // IGD — RM-2025-005 (Joko Prasetyo, NSTEMI + Syok Kardiogenik)
  "RM-2025-005": [
    {
      id: "igd-ho-001",
      tanggal: "2026-05-13",
      shift: "Siang",
      jamSerahTerima: "14:03",
      perawatKeluar: "Ns. Ratih Permata",
      perawatMasuk: "Ns. Ahmad Fauzi",
      jamTerima: "14:09",
      situation:
        "Sadar, tampak lemah, pucat, diaforesis, akral dingin. O2 NRM 15 lpm. Nyeri dada 7/10 (turun dari 9/10), sesak berkurang dengan O2.",      background:
        "O2 NRM 15 lpm, IV line ×2, EKG 12 lead, loading Aspirin 300mg + Clopidogrel 300mg, Morfin 3mg IV (10:38), darah lengkap + troponin terambil. IVFD NaCl 0.9% 500ml tetes lambat.",
      assessment:
        "Syok kardiogenik — MAP <65 mmHg, nyeri akut, pola napas tidak efektif. TD 80/50→95/60 pasca loading, SpO₂ 88%→93%. Troponin T 2.4 ng/mL (kritis). Konsul kardiologi terkirim.",
      recommendation:
        "Tunggu balasan kardiologi, rencana transfer ICU. Dopamin 5 mcg/kg/mnt disiapkan bila TD drop. Monitor TTV tiap 15 menit (P1), awasi tanda syok. Pending: EKG serial 15:00.",
    },
    {
      id: "igd-ho-002",
      tanggal: "2026-05-13",
      shift: "Malam",
      jamSerahTerima: "21:05",
      perawatKeluar: "Ns. Ahmad Fauzi",
      perawatMasuk: "Ns. Lestari Dewi",
      jamTerima: "21:11",
      situation:
        "Sadar composmentis, masih lemah namun membaik, akral mulai hangat. O2 diturunkan ke simple mask 6 lpm. Nyeri dada 3/10, sesak minimal.",      background:
        "Kardiologi visit 16:45 — advis Dobutamin bila TD <90 (tak diperlukan), lanjut monitoring, rencana transfer ICU besok pagi. Obat: Atorvastatin 40mg + Bisoprolol 2.5mg PO (18:00). EKG serial 15:00 & 18:00 stabil.",
      assessment:
        "Penurunan curah jantung membaik parsial, nyeri berkurang. TD 95/60→105/68. Troponin serial 18:00: 3.8 ng/mL (pola NSTEMI). Konfirmasi transfer ICU besok 07:00.",
      recommendation:
        "Transfer ICU 07:00 — siapkan surat transfer + resume IGD (dokter jaga ICU dikonfirmasi). Monitor TTV tiap 30 menit, awasi rhythm EKG, pastikan IV line paten. Pending: lengkapi dokumen transfer (resume, lab, EKG, consent ICU).",
    },
  ],
};
