"use client";

/**
 * Informed Consent Cetak Template — Formulir Persetujuan Tindakan Kedokteran (A4).
 *
 * Render dari InformedConsentDetailDTO (getInformedConsentDetail — termasuk TTD image).
 * Murni presentasional; tak fetch, tak mutate. Lebar w-full → ikut `.print-area[data-paper="A4"]`.
 * Reuse KopSuratEklaim sebagai KOP RS resmi (single source identitas RS — pola TriaseCetakTemplate).
 * Warna banner keputusan preserved saat print via `.print-area *{ print-color-adjust:exact }`.
 */

import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import type { InformedConsentDetailDTO } from "@/lib/schemas/informedConsent/informedConsent";

// ── Helpers ───────────────────────────────────────────────

function fmtTanggalJam(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const tgl = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const jam = `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
  return `${tgl} · ${jam} WIB`;
}
function fmtTanggalShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// ── Sub-components ────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-[3px] leading-snug">
      <span className="w-32 shrink-0 text-[8pt] text-slate-500">{label}</span>
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

function Narasi({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="mt-1.5">
      <p className="text-[7.5pt] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-[9pt] leading-snug text-slate-800">{value}</p>
    </div>
  );
}

function TtdBox({ title, nama, image }: { title: string; nama: string; image?: string | null }) {
  return (
    <div className="text-center">
      <p className="text-[8.5pt] font-semibold text-slate-700">{title}</p>
      <div className="mx-auto mt-1 flex h-20 w-44 items-center justify-center overflow-hidden rounded border border-slate-300 bg-white">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`TTD ${title}`} className="h-full w-full object-contain" />
        ) : (
          <span className="text-[7.5pt] italic text-slate-300">( tanda tangan )</span>
        )}
      </div>
      <p className="mt-1 text-[9pt] font-bold text-slate-800">{nama || "—"}</p>
      <p className="text-[7.5pt] text-slate-400">Nama &amp; Tanda Tangan</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

interface Props {
  detail: InformedConsentDetailDTO;
  patient: { name: string; noRM: string };
}

export default function ICCetakTemplate({ detail, patient }: Props) {
  const rs = RS_PROFIL_INITIAL;
  const setuju = detail.keputusan === "setuju";
  const bannerCfg = setuju
    ? { bar: "bg-emerald-600", soft: "bg-emerald-50 border-emerald-300", text: "text-emerald-700", label: "SETUJU", desc: "Pasien/wali MENYETUJUI tindakan" }
    : { bar: "bg-rose-600", soft: "bg-rose-50 border-rose-300", text: "text-rose-700", label: "MENOLAK", desc: "Pasien/wali MENOLAK tindakan" };

  const hasPenjelasan = !!(
    detail.tujuan || detail.manfaat || detail.risiko.length || detail.risikoLain ||
    detail.alternatif || detail.konsekuensiTolak || detail.pertanyaanPasien
  );

  return (
    <div className="w-full bg-white px-12 py-9 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      {/* ── Title ── */}
      <div className="mt-3 text-center">
        <h2 className="text-[13pt] font-bold uppercase tracking-widest text-slate-800">
          Persetujuan Tindakan Kedokteran
        </h2>
        <p className="text-[8pt] tracking-wide text-slate-500">
          Informed Consent · PMK No. 290/MENKES/PER/III/2008 · {rs.nama}
        </p>
        <p className="mt-0.5 font-mono text-[8.5pt] font-semibold text-slate-600">No. {detail.noFormulir}</p>
      </div>

      {/* ── Banner keputusan ── */}
      <div className={`mt-3 flex items-stretch overflow-hidden rounded-xl border ${bannerCfg.soft}`}>
        <div className={`flex w-28 shrink-0 flex-col items-center justify-center ${bannerCfg.bar} px-3 py-2 text-white`}>
          <span className="text-[13pt] font-black leading-none">{bannerCfg.label}</span>
        </div>
        <div className="flex flex-1 items-center justify-between px-4 py-2">
          <div>
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-slate-500">Keputusan</p>
            <p className={`text-[10.5pt] font-bold ${bannerCfg.text}`}>{bannerCfg.desc}</p>
          </div>
          <div className="text-right">
            <p className="text-[7.5pt] uppercase tracking-wide text-slate-400">Waktu Persetujuan</p>
            <p className="text-[9pt] font-semibold text-slate-700">{fmtTanggalJam(detail.waktuPersetujuan)}</p>
          </div>
        </div>
      </div>

      {/* ── Identitas + tindakan ── */}
      <div className="mt-3 grid grid-cols-2 gap-x-10">
        <div>
          <SectionHead>Identitas Pasien</SectionHead>
          <Field label="Nama">{patient.name}</Field>
          <Field label="No. Rekam Medis"><span className="font-mono">{patient.noRM}</span></Field>
          <Field label="Penanda Tangan">{detail.penandaNama}</Field>
          <Field label="Hubungan">{detail.penandaHubungan}</Field>
        </div>
        <div>
          <SectionHead>Tindakan / Prosedur</SectionHead>
          <Field label="Nama Tindakan">{detail.tindakanNama}</Field>
          <Field label="Kategori">{detail.tindakanKategori?.replace(/_/g, " ")}</Field>
          <Field label="Dokter Pelaksana">{detail.namaDokter}</Field>
        </div>
      </div>

      {/* ── Penjelasan ── */}
      {hasPenjelasan && (
        <>
          <SectionHead>Penjelasan yang Diberikan</SectionHead>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-2.5">
            <Narasi label="Tujuan Tindakan" value={detail.tujuan} />
            <Narasi label="Manfaat yang Diharapkan" value={detail.manfaat} />
            {detail.risiko.length > 0 && (
              <div className="mt-1.5">
                <p className="text-[7.5pt] uppercase tracking-wide text-slate-400">Risiko &amp; Komplikasi</p>
                <ul className="mt-0.5 grid grid-cols-2 gap-x-6 gap-y-0.5">
                  {detail.risiko.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[9pt] text-slate-800">
                      <span className="mt-[4px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Narasi label="Risiko Spesifik Lainnya" value={detail.risikoLain} />
            <Narasi label="Alternatif Tindakan" value={detail.alternatif} />
            <Narasi label="Konsekuensi jika Ditolak" value={detail.konsekuensiTolak} />
            <Narasi label="Pertanyaan / Klarifikasi" value={detail.pertanyaanPasien} />
          </div>
        </>
      )}

      {/* ── Alasan penolakan ── */}
      {!setuju && detail.alasanTolak && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/70 px-4 py-2.5">
          <p className="text-[7.5pt] font-bold uppercase tracking-wide text-rose-600">Alasan Penolakan</p>
          <p className="text-[9pt] text-slate-800">{detail.alasanTolak}</p>
        </div>
      )}

      {/* ── Pernyataan ── */}
      <SectionHead>Pernyataan</SectionHead>
      <p className="text-[8.5pt] leading-relaxed text-slate-700">
        Saya yang bertanda tangan di bawah ini menyatakan bahwa saya telah menerima penjelasan
        yang lengkap dan jelas dari <strong>{detail.namaDokter}</strong> mengenai tindakan
        <strong> &ldquo;{detail.tindakanNama}&rdquo;</strong>, mencakup tujuan, manfaat, risiko, serta
        alternatif tindakan, dan saya memahaminya. Dengan penuh kesadaran dan tanpa paksaan, saya
        menyatakan <strong className={bannerCfg.text}>{setuju ? "MENYETUJUI" : "MENOLAK"}</strong> dilaksanakannya
        tindakan medis tersebut.
      </p>

      {/* ── Tanda tangan ── */}
      <div className="mt-5">
        <p className="text-right text-[8.5pt] text-slate-600">
          {rs.alamat.kota}, {fmtTanggalShort(detail.waktuPersetujuan)}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-8">
          <TtdBox title="Pasien / Wali" nama={detail.penandaNama} image={detail.signatureData} />
          <TtdBox title="Dokter / DPJP" nama={detail.namaDokter} />
        </div>
        {(detail.saksi1 || detail.saksi2) && (
          <div className="mt-4 grid grid-cols-2 gap-8">
            {detail.saksi1 && <TtdBox title="Saksi 1" nama={detail.saksi1} />}
            {detail.saksi2 && <TtdBox title="Saksi 2" nama={detail.saksi2} />}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="mt-6 border-t border-slate-200 pt-2 text-center text-[7pt] text-slate-400">
        Dokumen ini dicetak dari rekam medis elektronik EHIS · {rs.nama} ·
        Dicatat oleh {detail.petugas} · {fmtTanggalJam(detail.createdAt)}
      </div>
    </div>
  );
}
