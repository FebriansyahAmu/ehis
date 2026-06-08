"use client";

/**
 * Triase Cetak Template — Lembar Triase Gawat Darurat (A4).
 *
 * Render dari TriaseDTO (getLatest — pengkajian triase yang BERLAKU) + identitas
 * pasien (IGDPatientDetail). Murni presentasional; tak fetch, tak mutate.
 * Lebar w-full → mengikuti `.print-area[data-paper="A4"]` (190mm) saat cetak.
 *
 * Reuse KopSuratEklaim sebagai KOP RS resmi (single source identitas RS — pola
 * sama dipakai SEPCetakTemplate). Warna level triase preserved saat print via
 * `.print-area *{ print-color-adjust:exact }` (globals.css).
 */

import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import type { TriaseDTO } from "@/lib/schemas/triase";
import type { IGDPatientDetail } from "@/lib/data";

// ── Helpers ───────────────────────────────────────────────

function fmtTanggalJam(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const tgl = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const jam = `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
  return `${tgl} · ${jam} WIB`;
}

function fmtTanggalShort(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s || "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const genderLabel = (g: "L" | "P") => (g === "L" ? "Laki-laki" : "Perempuan");

const LEVEL_CFG: Record<
  string,
  { kode: string; warna: string; desc: string; bar: string; soft: string; text: string }
> = {
  P1: { kode: "P1", warna: "MERAH", desc: "Resusitasi · Mengancam Jiwa", bar: "bg-rose-600", soft: "bg-rose-50 border-rose-300", text: "text-rose-700" },
  P2: { kode: "P2", warna: "KUNING", desc: "Gawat Darurat · Emergency", bar: "bg-amber-500", soft: "bg-amber-50 border-amber-300", text: "text-amber-700" },
  P3: { kode: "P3", warna: "HIJAU", desc: "Tidak Gawat Darurat · Urgent", bar: "bg-emerald-600", soft: "bg-emerald-50 border-emerald-300", text: "text-emerald-700" },
  P4: { kode: "P4", warna: "HITAM", desc: "Meninggal · DOA", bar: "bg-slate-800", soft: "bg-slate-100 border-slate-400", text: "text-slate-700" },
};

// ── Sub-components ────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-[3px] leading-snug">
      <span className="w-28 shrink-0 text-[8pt] text-slate-500">{label}</span>
      <span className="text-[8pt] text-slate-400">:</span>
      <span className="flex-1 text-[9pt] font-medium text-slate-800">{children || "—"}</span>
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 mt-3.5 border-b border-slate-200 pb-1 text-[8pt] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </p>
  );
}

function Pair({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="leading-snug">
      <p className="text-[7.5pt] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-[9pt] font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

interface Props {
  data: TriaseDTO;
  patient: IGDPatientDetail;
}

export default function TriaseCetakTemplate({ data, patient }: Props) {
  const rs = RS_PROFIL_INITIAL;
  const lvl = LEVEL_CFG[data.triageLevel] ?? LEVEL_CFG.P3;

  // Kelompokkan kriteria observasi terpilih per-parameter (urut sesuai `urutan`).
  const grouped = data.selectedCriteria
    .slice()
    .sort((a, b) => a.urutan - b.urutan)
    .reduce<Record<string, { parameterLabel: string; items: { levelLabel: string; nilai: string }[] }>>(
      (acc, c) => {
        (acc[c.parameterKode] ??= { parameterLabel: c.parameterLabel, items: [] }).items.push({
          levelLabel: c.levelLabel,
          nilai: c.nilai,
        });
        return acc;
      },
      {},
    );
  const groupedList = Object.values(grouped);

  return (
    <div className="w-full bg-white px-12 py-9 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      {/* ── Title ── */}
      <div className="mt-3 text-center">
        <h2 className="text-[13pt] font-bold uppercase tracking-widest text-slate-800">
          Lembar Triase Gawat Darurat
        </h2>
        <p className="text-[8pt] tracking-wide text-slate-500">
          Instalasi Gawat Darurat (IGD) · {rs.nama}
        </p>
      </div>

      {/* ── Banner level triase ── */}
      <div className={`mt-3 flex items-stretch overflow-hidden rounded-xl border ${lvl.soft}`}>
        <div className={`flex w-24 shrink-0 flex-col items-center justify-center ${lvl.bar} px-3 py-2 text-white`}>
          <span className="text-[18pt] font-black leading-none">{lvl.kode}</span>
          <span className="mt-0.5 text-[7.5pt] font-bold tracking-widest">{lvl.warna}</span>
        </div>
        <div className="flex flex-1 items-center justify-between px-4 py-2">
          <div>
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-slate-500">Keputusan Triase</p>
            <p className={`text-[11pt] font-bold ${lvl.text}`}>{lvl.desc}</p>
          </div>
          <div className="text-right">
            <p className="text-[7.5pt] uppercase tracking-wide text-slate-400">Waktu Triase</p>
            <p className="text-[9pt] font-semibold text-slate-700">{fmtTanggalJam(data.waktuTriase)}</p>
          </div>
        </div>
      </div>

      {/* ── Identitas pasien + kunjungan ── */}
      <div className="mt-3 grid grid-cols-2 gap-x-10">
        <div>
          <SectionHead>Identitas Pasien</SectionHead>
          <Field label="Nama">{patient.name}</Field>
          <Field label="No. Rekam Medis"><span className="font-mono">{patient.noRM}</span></Field>
          <Field label="Tgl. Lahir / Usia">
            {fmtTanggalShort(patient.tanggalLahir)} ({patient.age} th)
          </Field>
          <Field label="Jenis Kelamin">{genderLabel(patient.gender)}</Field>
          <Field label="Alamat">{patient.alamat}</Field>
        </div>
        <div>
          <SectionHead>Data Kunjungan</SectionHead>
          <Field label="No. Kunjungan"><span className="font-mono">{patient.noKunjungan}</span></Field>
          <Field label="Tgl. Kunjungan">{fmtTanggalShort(patient.tglKunjungan)}</Field>
          <Field label="Cara Masuk">{data.caraMasuk || patient.caraMasuk}</Field>
          <Field label="Kondisi Tiba">{data.kondisiTiba}</Field>
          <Field label="Penjamin">{patient.penjamin}</Field>
        </div>
      </div>

      {/* ── Anamnesis ── */}
      <SectionHead>Anamnesis</SectionHead>
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-2.5">
        <p className="text-[7.5pt] uppercase tracking-wide text-slate-400">Keluhan Utama</p>
        <p className="text-[9.5pt] font-medium text-slate-800">{data.keluhanUtama}</p>
        <div className="mt-2 grid grid-cols-3 gap-x-6 gap-y-2">
          <Pair label="Onset" value={data.onset} />
          <Pair label="Lokasi" value={data.lokasiKeluhan} />
          <Pair label="Kualitas" value={data.kualitasKeluhan} />
          <Pair label="Skala Berat" value={data.skalaBerat} />
          <Pair label="Faktor Pemberat" value={data.faktorPemberat} />
          <Pair label="Faktor Peringan" value={data.faktorPeringan} />
        </div>
        {data.gejalaPenyerta.length > 0 && (
          <div className="mt-2">
            <p className="text-[7.5pt] uppercase tracking-wide text-slate-400">Gejala Penyerta</p>
            <p className="text-[9pt] text-slate-800">{data.gejalaPenyerta.join(", ")}</p>
          </div>
        )}
        {data.riwayatSerupa && (
          <div className="mt-2">
            <p className="text-[7.5pt] uppercase tracking-wide text-slate-400">Riwayat Serupa</p>
            <p className="text-[9pt] text-slate-800">{data.riwayatSerupa}</p>
          </div>
        )}
      </div>

      {/* ── Primary Survey ABCDE ── */}
      <SectionHead>Primary Survey (ABCDE)</SectionHead>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <div className="rounded-md border border-slate-200 px-3 py-2">
          <p className="mb-1 text-[8pt] font-bold text-sky-700">A · Airway</p>
          <Field label="Status">{data.airwayStatus}</Field>
          <Field label="Suara Abnormal">{data.suaraNapasAbnormal.join(", ")}</Field>
        </div>
        <div className="rounded-md border border-slate-200 px-3 py-2">
          <p className="mb-1 text-[8pt] font-bold text-emerald-700">B · Breathing</p>
          <Field label="Kualitas">{data.breathingQuality}</Field>
          <Field label="Dada / Otot">
            {[data.pergerakanDada, data.ototBantu && `otot ${data.ototBantu}`, data.sianosis && `sianosis ${data.sianosis}`].filter(Boolean).join(" · ")}
          </Field>
        </div>
        <div className="rounded-md border border-slate-200 px-3 py-2">
          <p className="mb-1 text-[8pt] font-bold text-rose-700">C · Circulation</p>
          <Field label="Nadi">{[data.nadiTeraba, data.kualitasNadi].filter(Boolean).join(" · ")}</Field>
          <Field label="CRT / Kulit">{[data.crt, data.kondisiKulit].filter(Boolean).join(" · ")}</Field>
          <Field label="Perdarahan">{data.perdarahan}</Field>
        </div>
        <div className="rounded-md border border-slate-200 px-3 py-2">
          <p className="mb-1 text-[8pt] font-bold text-violet-700">D · Disability</p>
          <Field label="Kesadaran (AVPU)">{data.avpu}</Field>
          <Field label="Pupil / Refleks">{[data.pupil, data.refleksCahaya].filter(Boolean).join(" · ")}</Field>
        </div>
        <div className="rounded-md border border-slate-200 px-3 py-2">
          <p className="mb-1 text-[8pt] font-bold text-amber-700">E · Exposure</p>
          <Field label="Trauma / Luka">{[data.traumaLuka, data.lokasiLuka].filter(Boolean).join(" — ")}</Field>
          <Field label="Suhu Kulit">{data.suhuKulit}</Field>
        </div>
      </div>

      {/* ── Kriteria observasi terpilih (centang panduan) ── */}
      <SectionHead>
        Kriteria Observasi Terpilih
        {data.protocolNama && (
          <span className="ml-2 font-normal normal-case tracking-normal text-slate-400">
            — Protokol {data.protocolNama}
          </span>
        )}
      </SectionHead>
      {groupedList.length === 0 ? (
        <p className="text-[8.5pt] italic text-slate-400">Tidak ada kriteria observasi yang dicentang.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {groupedList.map((g, i) => (
            <div key={i} className="page-break-avoid border-l-2 border-slate-300 pl-2.5 py-0.5">
              <p className="text-[8pt] font-semibold text-slate-700">{g.parameterLabel}</p>
              <ul className="mt-0.5 space-y-0.5">
                {g.items.map((it, k) => (
                  <li key={k} className="flex items-start gap-1.5 text-[8.5pt] text-slate-700">
                    <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>
                      {it.nilai}
                      <span className="ml-1 text-[7.5pt] text-slate-400">({it.levelLabel})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* ── Diagnosa & Tindakan ── */}
      <SectionHead>Diagnosa Sementara & Tindakan Awal</SectionHead>
      <div className="grid grid-cols-2 gap-x-6">
        <Pair label="Diagnosa / Kesan Klinis" value={data.diagnosisSementara} />
        <Pair label="Tindakan di Area Triase" value={data.tindakanTriase.join(", ")} />
      </div>

      {/* ── Tanda Tangan ── */}
      <div className="mt-8 flex justify-end">
        <div className="w-64 text-center">
          <p className="text-[8.5pt] text-slate-600">{rs.alamat.kota}, {fmtTanggalShort(data.waktuTriase)}</p>
          <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">Perawat / Petugas Triase</p>
          <div className="mt-12 border-b border-slate-700" />
          <p className="mt-1 text-[9pt] font-bold text-slate-800">{data.perawatTriase}</p>
          <p className="text-[7.5pt] text-slate-400">Nama &amp; Tanda Tangan</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-6 border-t border-slate-200 pt-2 text-center text-[7pt] text-slate-400">
        Dokumen ini dicetak dari rekam medis elektronik EHIS · {rs.nama} ·
        Dicatat: {fmtTanggalJam(data.createdAt)}
      </div>
    </div>
  );
}
