// Types, constants, helpers, and mock data for shared Handover (Serah Terima Shift)

// ── Shared patient interface ──────────────────────────────

export interface HandoverPatient {
  name: string;
  noRM: string;
  subtitle: string;  // built by caller (e.g. "diagnosa · Hari ke-3 · Anggrek 201B")
  badge?: string;    // DPJP or doctor name
  vitalSigns: {
    tdSistolik: number;
    tdDiastolik: number;
    nadi: number;
    suhu: number;
    spo2: number;
    skalaNyeri: number;
  };
}

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
    activeBg: "bg-indigo-500",
    activeBorder: "border-indigo-500",
    activeText: "text-white",
    badge: "bg-indigo-100 text-indigo-700",
    dot: "bg-indigo-400",
    ring: "ring-indigo-200",
  },
};

export const SBAR_DEF = [
  {
    key: "S" as const,
    label: "Situation",
    desc: "Kondisi & keluhan aktif pasien",
    border: "border-violet-200",
    bg: "bg-violet-50",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-700",
    ring: "ring-violet-200",
  },
  {
    key: "B" as const,
    label: "Background",
    desc: "TTV, tindakan & obat shift ini",
    border: "border-sky-200",
    bg: "bg-sky-50",
    text: "text-sky-700",
    badge: "bg-sky-100 text-sky-700",
    ring: "ring-sky-200",
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
  },
] as const;

export type SBARItem = (typeof SBAR_DEF)[number];

// ── Data types ────────────────────────────────────────────

export interface HandoverTTV {
  td: string;
  nadi: number;
  suhu: number;
  spo2: number;
  nrs: number;
}

export interface HandoverEntry {
  id: string;
  tanggal: string;        // "2026-05-14" ISO
  shift: Shift;
  jamSerahTerima: string; // "07:12"
  perawatKeluar: string;
  perawatMasuk: string;
  // S — Situation
  kondisiUmum: string;
  keluhanAktif: string;
  // B — Background
  ttvTerakhir: HandoverTTV;
  tindakanShift: string;
  obatDiberikan: string;
  // A — Assessment
  masalahAktif: string;
  perubahanKondisi: string;
  // R — Recommendation
  instruksiPending: string;
  halDipantau: string;
  tindakanPending: string;
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

// ── Mock data ─────────────────────────────────────────────

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
      kondisiUmum:
        "Pasien sadar penuh, composmentis. Sesak napas berkurang dibanding semalam, posisi semi-Fowler 30°.",
      keluhanAktif:
        "Masih terasa sesak ringan saat berbaring datar. Tidak ada nyeri dada aktif.",
      ttvTerakhir: { td: "130/85", nadi: 82, suhu: 36.8, spo2: 96, nrs: 2 },
      tindakanShift:
        "Pemasangan IV line, nebulisasi salbutamol 2×, monitoring TTV tiap 4 jam, balance cairan.",
      obatDiberikan:
        "Furosemid 40mg IV (05:00), Spironolakton 25mg PO (06:00), Bisoprolol 2.5mg PO (06:00).",
      masalahAktif:
        "Kelebihan volume cairan — edema tungkai masih +2. Pola napas tidak efektif membaik.",
      perubahanKondisi:
        "SpO₂ meningkat 93% → 96% setelah nebulisasi. Urine output 600ml shift malam.",
      instruksiPending:
        "DPJP instruksi rontgen thorax pagi jam 08:00. Tunggu hasil sebelum konsul kardiologi.",
      halDipantau:
        "Balance cairan ketat, target UO ≥0.5ml/kgBB/jam. SpO₂ dipertahankan >95%.",
      tindakanPending:
        "Pengambilan darah untuk BNP dan elektrolit jam 07:30.",
    },
    {
      id: "ho-002",
      tanggal: "2026-05-13",
      shift: "Siang",
      jamSerahTerima: "14:05",
      perawatKeluar: "Ns. Rina Sari",
      perawatMasuk: "Ns. Budi Santoso",
      kondisiUmum:
        "Pasien sadar, tenang. Sesak minimal. Makan siang habis setengah porsi.",
      keluhanAktif:
        "Kaki masih bengkak tapi berkurang. Merasa lebih nyaman saat duduk.",
      ttvTerakhir: { td: "125/80", nadi: 78, suhu: 36.6, spo2: 97, nrs: 1 },
      tindakanShift:
        "Rontgen thorax selesai. Konsul Sp.GIZ masuk, rencana diet rendah garam 2g/hari.",
      obatDiberikan:
        "Furosemid 40mg IV (12:00), Ramipril 5mg PO (13:00). MAR lengkap.",
      masalahAktif:
        "Kelebihan volume cairan membaik. Edema +1. Risiko jatuh sedang (Morse 45).",
      perubahanKondisi:
        "BNP turun 890 → 720 pg/mL. Pasien mulai mobilisasi bertahap di kamar.",
      instruksiPending:
        "DPJP visit jam 16:00. Siapkan hasil lab BNP + elektrolit + rontgen.",
      halDipantau:
        "Monitor edema tungkai pagi-sore. Restriksi cairan 1500ml/hari.",
      tindakanPending:
        "Pemasangan kaus kaki antiemboli sebelum jam 18:00.",
    },
    {
      id: "ho-003",
      tanggal: "2026-05-13",
      shift: "Malam",
      jamSerahTerima: "21:08",
      perawatKeluar: "Ns. Budi Santoso",
      perawatMasuk: "Ns. Yanti Putri",
      kondisiUmum:
        "Pasien sadar, rileks. Edema tungkai membaik signifikan.",
      keluhanAktif:
        "Tidak ada keluhan aktif malam ini. Pasien tidur nyenyak sejak 20:00.",
      ttvTerakhir: { td: "120/78", nadi: 75, suhu: 36.5, spo2: 98, nrs: 0 },
      tindakanShift:
        "Visit DPJP jam 16:30, advis lanjutkan terapi, rencana KRS besok jika kondisi stabil.",
      obatDiberikan:
        "Semua obat malam diberikan sesuai MAR. Tidak ada obat tertunda.",
      masalahAktif:
        "Volume cairan mendekati normal. Kondisi stabil menjelang KRS.",
      perubahanKondisi:
        "Kondisi stabil dan membaik. DPJP berencana KRS besok pagi.",
      instruksiPending:
        "Siapkan resume medis dan surat pulang. Edukasi pasien + keluarga jam 08:00.",
      halDipantau:
        "Pantau TTV pagi, jika stabil lanjutkan proses KRS.",
      tindakanPending:
        "Koordinasi farmasi untuk obat pulang. Booking kontrol poli jantung.",
    },
    {
      id: "ho-004",
      tanggal: "2026-05-14",
      shift: "Pagi",
      jamSerahTerima: "07:09",
      perawatKeluar: "Ns. Yanti Putri",
      perawatMasuk: "Ns. Dewi Rahayu",
      kondisiUmum:
        "Pasien sadar, semangat. Menanyakan jadwal pulang hari ini.",
      keluhanAktif:
        "Tidak ada keluhan. Minta izin mandi dan bersiap pulang.",
      ttvTerakhir: { td: "118/76", nadi: 72, suhu: 36.4, spo2: 98, nrs: 0 },
      tindakanShift:
        "Aff IV line, edukasi pasien & keluarga tentang obat pulang dan jadwal kontrol.",
      obatDiberikan:
        "Obat pagi diberikan: Bisoprolol 2.5mg, Ramipril 5mg, Spironolakton 25mg.",
      masalahAktif:
        "Kondisi stabil. Rencana KRS hari ini setelah resume medis ditandatangani DPJP.",
      perubahanKondisi:
        "Semua parameter klinis dalam batas normal. Pasien siap KRS.",
      instruksiPending:
        "DPJP akan datang jam 10:00 untuk tanda tangan resume medis dan surat pulang.",
      halDipantau:
        "Tidak ada pemantauan kritis. Pastikan kelengkapan dokumen pulang.",
      tindakanPending:
        "Koordinasi administrasi: clearance billing, obat pulang dari farmasi.",
    },
  ],

  // IGD — RM-2025-005 (Joko Prasetyo, NSTEMI + Cardiogenic Shock)
  "RM-2025-005": [
    {
      id: "igd-ho-001",
      tanggal: "2026-05-13",
      shift: "Siang",
      jamSerahTerima: "14:03",
      perawatKeluar: "Ns. Ratih Permata",
      perawatMasuk: "Ns. Ahmad Fauzi",
      kondisiUmum:
        "Pasien sadar, tampak lemah, pucat, diaforesis. Akral dingin. Terpasang O2 NRM 15 lpm.",
      keluhanAktif:
        "Nyeri dada masih ada, skala 7/10 (berkurang dari 9/10 awal masuk). Sesak napas berkurang dengan O2.",
      ttvTerakhir: { td: "95/60", nadi: 108, suhu: 36.4, spo2: 93, nrs: 7 },
      tindakanShift:
        "O2 NRM 15 lpm, IV line ×2 terpasang, EKG 12 lead selesai, loading Aspirin 300mg + Clopidogrel 300mg, Morfin 3mg IV diberikan, darah lengkap + troponin terambil.",
      obatDiberikan:
        "Aspirin 300mg PO (10:35), Clopidogrel 300mg PO (10:35), Morfin 3mg IV (10:38). IVFD NaCl 0.9% 500ml tetes lambat.",
      masalahAktif:
        "Penurunan curah jantung (Syok Kardiogenik) — MAP <65 mmHg. Nyeri akut. Pola napas tidak efektif.",
      perubahanKondisi:
        "TD membaik 80/50 → 95/60 setelah loading cairan. SpO₂ membaik 88% → 93% dengan NRM. Troponin T 2.4 ng/mL (kritis). Konsul kardiologi sudah terkirim.",
      instruksiPending:
        "Tunggu balasan konsul kardiologi. Rencana transfer ICU. Dopamin 5 mcg/kg/mnt disiapkan jika TD kembali drop.",
      halDipantau:
        "Monitor TTV tiap 15 menit (P1). Awasi tanda syok: TD <90, nadi >120, akral dingin, penurunan kesadaran.",
      tindakanPending:
        "Siapkan transfer ICU setelah konfirmasi kardiologi. EKG serial ulang jam 15:00.",
    },
    {
      id: "igd-ho-002",
      tanggal: "2026-05-13",
      shift: "Malam",
      jamSerahTerima: "21:05",
      perawatKeluar: "Ns. Ahmad Fauzi",
      perawatMasuk: "Ns. Lestari Dewi",
      kondisiUmum:
        "Pasien sadar composmentis, masih lemah namun kondisi membaik. Akral mulai hangat. O2 NRM diturunkan ke simple mask 6 lpm.",
      keluhanAktif:
        "Nyeri dada berkurang signifikan, skala 3/10. Sesak minimal.",
      ttvTerakhir: { td: "105/68", nadi: 94, suhu: 36.5, spo2: 96, nrs: 3 },
      tindakanShift:
        "Kardiologi visit jam 16:45 — advis mulai Dobutamin 5 mcg/kg/mnt jika TD <90, lanjutkan monitoring, rencana transfer ICU besok pagi. EKG serial jam 15:00 + 18:00 stabil.",
      obatDiberikan:
        "Atorvastatin 40mg PO (18:00), Bisoprolol 2.5mg PO (18:00, setelah TD stabil). IVFD NaCl lanjut maintenance.",
      masalahAktif:
        "Penurunan curah jantung membaik parsial. Nyeri berkurang. Risiko perburukan masih ada.",
      perubahanKondisi:
        "Hemodinamik membaik. TD 95/60 → 105/68. Tidak diperlukan Dobutamin. Troponin serial jam 18:00: 3.8 ng/mL (meningkat, sesuai pola NSTEMI). Konfirmasi transfer ICU besok jam 07:00.",
      instruksiPending:
        "Transfer ICU jam 07:00. Siapkan surat transfer + resume IGD. Dokter jaga ICU sudah dikonfirmasi.",
      halDipantau:
        "Monitor TTV tiap 30 menit. Awasi perubahan EKG (rhythm). Pastikan IV line paten.",
      tindakanPending:
        "Lengkapi dokumen transfer ICU: resume, hasil lab, EKG terakhir, informed consent ICU.",
    },
  ],
};
