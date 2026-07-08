// Autofill Resume Pulang — komposisi teks SARAN untuk 4 narasi (anamnesis · penunjang ·
// terapi · kondisi pulang) dari domain klinis NYATA. Composer MURNI: pane fetch
// ResumeAggregates (TTV/lab/rad/obat/tindakan) + anamnesis + disposisi SEKALI lalu
// panggil composeResumePulangSuggestion. Hasil = draft teks yang DPJP suntingan sebelum
// simpan (bukan snapshot beku); prefill hanya field KOSONG (ketikan DPJP menang).

import type { AnamnesisDTO } from "@/lib/api/asesmenMedis/anamnesis";
import type { DisposisiDTO } from "@/lib/api/disposisi/disposisi";
import type { ResumeAggregates } from "@/components/shared/medical-records/resumeMedik/resumeMedikAggregates";

export interface ResumePulangSuggestion {
  ringkasanAnamnesis: string;
  hasilPemeriksaan: string;
  terapiDiberikan: string;
  kondisiSaatPulang: string;
}

const FLAG_SIGN: Record<string, string> = { tinggi: "↑", rendah: "↓", kritis: "!!" };

/** Rangkai potongan non-kosong (buang kosong, gabung pemisah). */
function join(parts: (string | null | undefined)[], sep = " "): string {
  return parts.map((p) => (p ?? "").trim()).filter(Boolean).join(sep);
}

export function composeResumePulangSuggestion(
  agg: ResumeAggregates,
  anamnesis: AnamnesisDTO | null,
  disposisi: DisposisiDTO | null,
): ResumePulangSuggestion {
  // ── Anamnesis singkat & pemeriksaan fisik ──
  const anamParts: string[] = [];
  if (anamnesis) {
    if (anamnesis.keluhanUtama.trim()) anamParts.push(`Keluhan utama: ${anamnesis.keluhanUtama.trim()}.`);
    if (anamnesis.rps.trim()) anamParts.push(`Riwayat penyakit sekarang: ${anamnesis.rps.trim()}.`);
    if (anamnesis.statusGeneralis.trim()) anamParts.push(`Pemeriksaan fisik: ${anamnesis.statusGeneralis.trim()}.`);
  }
  const ringkasanAnamnesis = anamParts.join("\n");

  // ── Hasil penunjang bermakna (lab abnormal + rad) ──
  const penunjangParts: string[] = [];
  if (agg.hasilLabAbnormal.length > 0) {
    const labs = agg.hasilLabAbnormal
      .map((l) => `${l.nama} ${l.nilai} ${l.satuan}${FLAG_SIGN[l.flag] ? ` ${FLAG_SIGN[l.flag]}` : ""}`.trim())
      .join("; ");
    penunjangParts.push(`Laboratorium: ${labs}.`);
  }
  if (agg.hasilRad.length > 0) {
    const rad = agg.hasilRad
      .map((r) => `${r.jenis}${r.tanggal ? ` (${r.tanggal})` : ""}: ${r.kesimpulan}`)
      .join(" ");
    penunjangParts.push(`Radiologi: ${rad}`);
  }
  const hasilPemeriksaan = penunjangParts.join("\n");

  // ── Terapi yang diberikan (obat + tindakan) ──
  const terapiParts: string[] = [];
  if (agg.obatSelamaRawat.length > 0) {
    const obat = agg.obatSelamaRawat
      .map((o) => join([o.namaObat, o.dosis && o.dosis !== "—" ? o.dosis : "", o.rute && o.rute !== "—" ? `(${o.rute})` : ""]))
      .join("; ");
    terapiParts.push(`Obat: ${obat}.`);
  }
  if (agg.tindakan.length > 0) {
    const tindakan = agg.tindakan
      .map((t) => join([t.namaTindakan, t.kodeIcd9 && t.kodeIcd9 !== "—" ? `[${t.kodeIcd9}]` : ""]))
      .join("; ");
    terapiParts.push(`Tindakan/prosedur: ${tindakan}.`);
  }
  const terapiDiberikan = terapiParts.join("\n");

  // ── Kondisi saat pulang (TTV pulang + kondisi umum disposisi) ──
  const kondisiParts: string[] = [];
  const t = agg.ttvPulang;
  if (t) {
    kondisiParts.push(join([
      t.tekananDarah ? `TD ${t.tekananDarah} mmHg` : "",
      t.nadi ? `Nadi ${t.nadi}×/mnt` : "",
      t.rr ? `RR ${t.rr}×/mnt` : "",
      t.suhu ? `Suhu ${t.suhu}°C` : "",
      t.spo2 ? `SpO₂ ${t.spo2}%` : "",
      t.kesadaran ? `kesadaran ${t.kesadaran}` : "",
    ], ", ") + ".");
  }
  if (disposisi?.kondisiUmum?.trim()) {
    kondisiParts.push(`Kondisi umum: ${disposisi.kondisiUmum.trim()}.`);
  }
  const kondisiSaatPulang = kondisiParts.join(" ");

  return { ringkasanAnamnesis, hasilPemeriksaan, terapiDiberikan, kondisiSaatPulang };
}
