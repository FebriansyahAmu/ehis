"use client";

/**
 * Resume Medis Template — A4 print layout (EK5.1).
 *
 * Struktur (A4 · 794px × 1123px @ 96dpi · margin 56px horizontal / 48px vertikal):
 *   KOP RS → Judul → I. Identitas & Kunjungan → II. Diagnosa (ICD-10-IM)
 *   → III. Tindakan (ICD-9-CM-IM) → IV. Grouper iDRG/INA-CBG → V. Anamnesis & Terapi
 *   → Signature Row (DPJP + Coder + Verifikator) → Footer
 *
 * Gunakan dengan printElementById('eklaim-print-root') dari BerkasGeneratorModal.
 */

import KopSuratEklaim from "./KopSuratEklaim";
import { formatRupiah } from "@/lib/eklaim/money";
import {
  fmtGender,
  fmtTipePelayanan,
  fmtCaraPulang,
  fmtDateLong,
  fmtDateShortDoc,
  todayLong,
} from "./berkasGeneratorShared";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";

// ── Subcomponents ──────────────────────────────────────

function DocSection({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 border border-slate-300 ek-avoid-break">{children}</div>;
}

function SectionHead({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-1.5 border-l-[3px] border-teal-600 bg-slate-100 px-3 py-1">
      <span className="text-[8.5pt] font-bold text-teal-700">{num}.</span>
      <span className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-700">
        {title}
      </span>
    </div>
  );
}

function DataGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 px-3 py-2">{children}</div>
  );
}

function DataRow({ label, value, mono = false, accent = false }: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-1 py-[1.5px]">
      <span className="w-[138px] shrink-0 text-[8.5pt] text-slate-500">{label}</span>
      <span className="shrink-0 text-[8.5pt] text-slate-400">:</span>
      <span
        className={[
          "text-[9pt]",
          mono ? "font-mono font-bold" : "",
          accent ? "font-bold text-teal-700" : "text-slate-900",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function SignatureCol({ title, location, date }: {
  title: string;
  location: string;
  date: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[8.5pt] text-slate-600">
        {location}, {date}
      </p>
      <p className="text-[8.5pt] font-semibold text-slate-800">{title}</p>
      <div className="mt-12 border-b border-slate-800" />
      <p className="mt-1 text-[8pt] text-slate-500">(Nama &amp; Tanda Tangan)</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────

interface Props {
  claim: ClaimRecord;
}

export default function ResumeMedisTemplate({ claim }: Props) {
  const rs = RS_PROFIL_INITIAL;
  const dp = claim.diagnosaPrimer;
  const ds = claim.diagnosaSekunder ?? [];
  const tp = claim.tindakanProsedur ?? [];
  const idrg = claim.iDRG;
  const cbg = claim.inaCbgLegacy;
  const today = fmtDateShortDoc(new Date().toISOString());
  const sectionBase = tp.length > 0 ? 4 : 3;

  // Mock clinical text — replaced with EHIS-Care data in backend integration
  const riwayat =
    "Pasien datang dengan keluhan sesuai diagnosa primer di atas. Telah dilakukan anamnesis, " +
    "pemeriksaan fisik menyeluruh, dan pemeriksaan penunjang yang diperlukan. Pasien mendapatkan " +
    "penanganan klinis sesuai prosedur standar pelayanan rumah sakit.";
  const terapiPulang =
    tp.length > 0
      ? `Telah dilakukan tindakan: ${tp.map((t) => `${t.kode} (${t.deskripsi})`).join("; ")}. ` +
        "Pasien direncanakan kontrol sesuai jadwal yang ditentukan oleh DPJP."
      : "Terapi medikamentosa sesuai kondisi pasien. Edukasi kesehatan diberikan sebelum pasien " +
        "pulang. Kontrol sesuai jadwal yang ditentukan oleh dokter yang merawat.";

  return (
    <div className="w-[794px] min-h-[1123px] bg-white px-14 py-12 font-sans text-slate-900">
      <KopSuratEklaim variant="full" />

      {/* ── Title ── */}
      <div className="mt-5 text-center">
        <h2 className="text-[13pt] font-bold uppercase tracking-[0.18em] text-slate-900">
          RESUME MEDIS
        </h2>
        <p className="mt-0.5 text-[8.5pt] text-slate-500">
          No. Klaim:&nbsp;
          <strong className="font-mono">{claim.noKlaim}</strong>
          &nbsp;·&nbsp; Tanggal Cetak: {today}
        </p>
      </div>

      {/* ── I. Identitas ── */}
      <div className="mt-4">
        <DocSection>
          <SectionHead num="I" title="Identitas Pasien & Kunjungan" />
          <DataGrid>
            <DataRow label="No. Rekam Medis" value={claim.pasienId} mono />
            <DataRow label="No. Kunjungan" value={claim.kunjunganId} mono />
            <DataRow label="Jenis Kelamin" value={fmtGender(claim.gender)} />
            <DataRow label="Umur" value={`${claim.age} tahun`} />
            <DataRow label="Jenis Pelayanan" value={fmtTipePelayanan(claim.tipePelayanan)} />
            <DataRow label="LOS (Hari Rawat)" value={`${claim.los} hari`} />
            <DataRow
              label="Kelas Rawat"
              value={claim.isKRIS ? "KRIS (Kelas Rawat Inap Standar)" : claim.kelas.replace("_", " ")}
            />
            <DataRow label="Cara Pulang" value={fmtCaraPulang(claim.caraPulang)} />
            <DataRow
              label="Penjamin"
              value={`${claim.penjamin.nama} (${claim.penjamin.tipe.toUpperCase()})`}
            />
            {claim.penjamin.sep && (
              <DataRow label="No. SEP" value={claim.penjamin.sep.noSEP} mono />
            )}
            <DataRow label="Tanggal Masuk" value={fmtDateLong(claim.createdAt)} />
            <DataRow
              label="Tingkat Kompetensi RS"
              value={
                claim.tingkatKompetensiRS.charAt(0).toUpperCase() +
                claim.tingkatKompetensiRS.slice(1)
              }
            />
          </DataGrid>
        </DocSection>

        {/* ── II. Diagnosa ── */}
        <DocSection>
          <SectionHead num="II" title="Diagnosa (ICD-10 Indonesian Modification)" />
          <div className="px-3 py-2">
            {/* Primer */}
            <div className="mb-1.5 flex items-start gap-2">
              <span className="w-16 shrink-0 text-[8.5pt] font-semibold text-slate-600">Primer</span>
              <span className="font-mono text-[9.5pt] font-bold text-teal-700">{dp.kode}</span>
              <span className="text-[9pt] text-slate-900">{dp.deskripsi}</span>
              <span className="text-[8pt] text-slate-400 shrink-0">[{dp.versiIM}]</span>
            </div>

            {/* Sekunder */}
            {ds.length > 0 && (
              <div className="pl-0">
                <p className="mb-1 text-[8.5pt] font-semibold text-slate-600">
                  Sekunder ({ds.length})
                </p>
                <div className="space-y-0.5 pl-4">
                  {ds.map((d, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-4 shrink-0 text-[8.5pt] text-slate-400">{i + 1}.</span>
                      <span className="font-mono text-[9pt] font-bold text-sky-700">{d.kode}</span>
                      <span className="text-[8.5pt] text-slate-700">{d.deskripsi}</span>
                      {d.hospitalAcquired && (
                        <span className="rounded bg-amber-100 px-1 text-[7.5pt] font-bold text-amber-700 ring-1 ring-amber-200">
                          HAI
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DocSection>

        {/* ── III. Tindakan (conditional) ── */}
        {tp.length > 0 && (
          <DocSection>
            <SectionHead num="III" title="Tindakan / Prosedur (ICD-9-CM Indonesian Modification)" />
            <div className="space-y-0.5 px-3 py-2">
              {tp.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-4 shrink-0 text-[8.5pt] text-slate-400">{i + 1}.</span>
                  <span className="font-mono text-[9pt] font-bold text-emerald-700">{t.kode}</span>
                  <span className="text-[8.5pt] text-slate-700">{t.deskripsi}</span>
                </div>
              ))}
            </div>
          </DocSection>
        )}

        {/* ── IV. Grouper ── */}
        <DocSection>
          <SectionHead
            num={tp.length > 0 ? "IV" : "III"}
            title="Hasil Grouper"
          />
          <DataGrid>
            <DataRow
              label="Era Grouper"
              value={claim.eraGrouper === "iDRG" ? "iDRG (Post-Oktober 2025)" : "INA-CBG Legacy (Pre-Oktober 2025)"}
            />
            {idrg && (
              <>
                <DataRow label="Kode iDRG" value={idrg.code} mono accent />
                <DataRow label="MDC" value={idrg.mdc} />
                <DataRow label="Group" value={idrg.group} />
                <DataRow
                  label="Severity"
                  value={`${idrg.severity.level} — ${idrg.severity.label}`}
                />
                <DataRow label="Versi Grouper" value={idrg.versiGrouper} />
                <DataRow label="Tarif iDRG Aktual" value={formatRupiah(idrg.tarifAktual)} accent />
                <DataRow label="Tarif RS Diajukan" value={formatRupiah(claim.tarifRS)} />
              </>
            )}
            {cbg && (
              <>
                <DataRow label="Kode INA-CBG" value={cbg.code} mono />
                <DataRow label="Group" value={cbg.group} />
                <DataRow
                  label="Severity"
                  value={["I", "II", "III"][cbg.severity - 1] ?? String(cbg.severity)}
                />
                <DataRow label="Versi Grouper" value={cbg.versiGrouper} />
              </>
            )}
          </DataGrid>
        </DocSection>

        {/* ── V. Anamnesis & Terapi ── */}
        <DocSection>
          <SectionHead
            num={String.fromCharCode(86 + (sectionBase - 4))} // "V" or "IV"
            title="Anamnesis Singkat & Rencana Tindak Lanjut"
          />
          <div className="space-y-2 px-3 py-2">
            <div>
              <p className="text-[8.5pt] font-semibold text-slate-600">
                Anamnesis &amp; Riwayat Penyakit
              </p>
              <p className="mt-0.5 text-[8.5pt] leading-relaxed text-slate-800">{riwayat}</p>
            </div>
            <div>
              <p className="text-[8.5pt] font-semibold text-slate-600">
                Terapi / Rencana Tindak Lanjut
              </p>
              <p className="mt-0.5 text-[8.5pt] leading-relaxed text-slate-800">{terapiPulang}</p>
            </div>
          </div>
        </DocSection>
      </div>

      {/* ── Signature Row ── */}
      <div className="mt-6 grid grid-cols-3 gap-8 ek-avoid-break">
        <SignatureCol title="Dokter DPJP" location={rs.alamat.kota} date={today} />
        <SignatureCol title="Coder Rekam Medis" location={rs.alamat.kota} date={today} />
        <SignatureCol title="Verifikator RS" location={rs.alamat.kota} date={today} />
      </div>

      {/* ── Footer ── */}
      <div className="mt-6 border-t border-slate-200 pt-2 text-center text-[7.5pt] text-slate-400">
        Dokumen ini digenerate oleh EHIS E-Klaim &nbsp;·&nbsp; {todayLong()} &nbsp;·&nbsp; {rs.nama}
      </div>
    </div>
  );
}
