"use client";

/**
 * Berkas Klaim Template — A4 cover sheet klaim (EK5.1).
 *
 * Struktur: KOP RS → Header klaim → I. Informasi Klaim → II. Hasil Grouper
 *   → III. Daftar Kelengkapan Berkas (table) → Tanda tangan Coder + Verifikator → Footer
 *
 * Digunakan sebagai lampiran pertama dalam bundle klaim ke BPJS/Asuransi.
 */

import KopSuratEklaim from "./KopSuratEklaim";
import { formatRupiah } from "@/lib/eklaim/money";
import {
  fmtGender,
  fmtTipePelayanan,
  fmtDateShortDoc,
  todayLong,
} from "./berkasGeneratorShared";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import type { ClaimRecord, BerkasStatus } from "@/lib/eklaim/eklaimShared";

// ── Status display mapping ─────────────────────────────

const STATUS_SYMBOL: Record<BerkasStatus, string> = {
  Siap: "✓ Siap",
  Belum: "○ Belum",
  "Tidak Berlaku": "— N/A",
  "Reject Verifikator": "✗ Ditolak",
};

const STATUS_COLOR: Record<BerkasStatus, string> = {
  Siap: "text-emerald-700",
  Belum: "text-amber-700",
  "Tidak Berlaku": "text-slate-400",
  "Reject Verifikator": "text-rose-700",
};

// ── Subcomponents ──────────────────────────────────────

function DocSection({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 border border-slate-300 ek-avoid-break">{children}</div>;
}

function SectionHead({ num, title, right }: { num: string; title: string; right?: string }) {
  return (
    <div className="flex items-center justify-between border-l-[3px] border-sky-600 bg-slate-100 px-3 py-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[8.5pt] font-bold text-sky-700">{num}.</span>
        <span className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-700">{title}</span>
      </div>
      {right && <span className="text-[8pt] text-slate-500">{right}</span>}
    </div>
  );
}

function DataRow({ label, value, mono = false }: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-1 py-[1.5px]">
      <span className="w-[130px] shrink-0 text-[8.5pt] text-slate-500">{label}</span>
      <span className="shrink-0 text-[8.5pt] text-slate-400">:</span>
      <span className={`text-[9pt] text-slate-900 ${mono ? "font-mono font-bold" : ""}`}>
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

export default function BerkasKlaimTemplate({ claim }: Props) {
  const rs = RS_PROFIL_INITIAL;
  const idrg = claim.iDRG;
  const cbg = claim.inaCbgLegacy;
  const berkasList = claim.berkas ?? [];
  const today = fmtDateShortDoc(new Date().toISOString());

  const totalWajib = berkasList.filter((b) => b.wajib).length;
  const siapWajib = berkasList.filter(
    (b) => b.wajib && (b.status === "Siap" || b.status === "Tidak Berlaku"),
  ).length;
  const siapTotal = berkasList.filter((b) => b.status === "Siap").length;
  const kelengkapanPct = totalWajib > 0 ? Math.round((siapWajib / totalWajib) * 100) : 100;

  return (
    <div className="w-[794px] min-h-[1123px] bg-white px-14 py-12 font-sans text-slate-900">
      <KopSuratEklaim variant="full" />

      {/* ── Document Title ── */}
      <div className="mt-5 text-center">
        <h2 className="text-[13pt] font-bold uppercase tracking-[0.18em]">
          LEMBAR BERKAS KLAIM
        </h2>
        <div className="mt-1 flex items-center justify-center gap-3 text-[8.5pt] text-slate-600">
          <span>No. Klaim: <strong className="font-mono">{claim.noKlaim}</strong></span>
          <span className="text-slate-300">·</span>
          <span>Penjamin: <strong>{claim.penjamin.nama}</strong></span>
          <span className="text-slate-300">·</span>
          <span>Tanggal: <strong>{today}</strong></span>
        </div>
      </div>

      <div className="mt-4">
        {/* ── I. Informasi Klaim ── */}
        <DocSection>
          <SectionHead num="I" title="Informasi Klaim" />
          <div className="grid grid-cols-2 gap-x-6 px-3 py-2">
            <DataRow label="No. Rekam Medis" value={claim.pasienId} mono />
            <DataRow label="No. Kunjungan" value={claim.kunjunganId} mono />
            <DataRow label="Jenis Kelamin" value={fmtGender(claim.gender)} />
            <DataRow label="Umur" value={`${claim.age} tahun`} />
            <DataRow label="Jenis Pelayanan" value={fmtTipePelayanan(claim.tipePelayanan)} />
            <DataRow label="LOS (Hari Rawat)" value={`${claim.los} hari`} />
            <DataRow
              label="Kelas Rawat"
              value={claim.isKRIS ? "KRIS (Standar)" : claim.kelas.replace("_", " ")}
            />
            <DataRow label="Era Grouper" value={claim.eraGrouper === "iDRG" ? "iDRG v1.0" : "INA-CBG Legacy"} />
            <DataRow
              label="Diagnosa Primer"
              value={`${claim.diagnosaPrimer.kode} — ${claim.diagnosaPrimer.deskripsi}`}
            />
            {claim.penjamin.sep && (
              <DataRow label="No. SEP" value={claim.penjamin.sep.noSEP} mono />
            )}
          </div>
        </DocSection>

        {/* ── II. Grouper Result ── */}
        {(idrg || cbg) && (
          <DocSection>
            <SectionHead num="II" title="Hasil Grouper" />
            <div className="flex items-stretch gap-0 px-3 py-2">
              {idrg && (
                <>
                  <div className="flex flex-1 flex-col items-center justify-center rounded border border-slate-200 bg-teal-50/60 p-2 text-center">
                    <p className="text-[7.5pt] text-slate-500">Kode iDRG</p>
                    <p className="font-mono text-[18pt] font-black text-teal-700 leading-none">
                      {idrg.code}
                    </p>
                    <p className="text-[8pt] text-slate-600">{idrg.group}</p>
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center rounded border border-slate-200 bg-white p-2 text-center">
                    <p className="text-[7.5pt] text-slate-500">Severity</p>
                    <p className="text-[13pt] font-bold text-slate-800">
                      {idrg.severity.level} — {idrg.severity.label}
                    </p>
                    {idrg.severity.ccList.length > 0 && (
                      <p className="text-[7.5pt] text-amber-600">
                        CC: {idrg.severity.ccList.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center rounded border border-slate-200 bg-emerald-50/60 p-2 text-center">
                    <p className="text-[7.5pt] text-slate-500">
                      Tarif Aktual ({claim.tingkatKompetensiRS})
                    </p>
                    <p className="text-[13pt] font-bold text-emerald-700">
                      {formatRupiah(idrg.tarifAktual)}
                    </p>
                    <p className="text-[7.5pt] text-slate-500">
                      Tarif RS: {formatRupiah(claim.tarifRS)}
                    </p>
                  </div>
                </>
              )}
              {cbg && (
                <>
                  <div className="flex flex-1 flex-col items-center justify-center rounded border border-slate-200 bg-amber-50/60 p-2 text-center">
                    <p className="text-[7.5pt] text-slate-500">Kode INA-CBG</p>
                    <p className="font-mono text-[18pt] font-black text-amber-700 leading-none">
                      {cbg.code}
                    </p>
                    <p className="text-[8pt] text-slate-600">{cbg.group}</p>
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center rounded border border-slate-200 bg-white p-2 text-center">
                    <p className="text-[7.5pt] text-slate-500">Severity (Legacy)</p>
                    <p className="text-[16pt] font-bold text-slate-800">
                      {["I", "II", "III"][cbg.severity - 1]}
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center rounded border border-slate-200 bg-emerald-50/60 p-2 text-center">
                    <p className="text-[7.5pt] text-slate-500">Tarif Kelas II</p>
                    <p className="text-[13pt] font-bold text-emerald-700">
                      {formatRupiah(cbg.tarif.kelas2)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </DocSection>
        )}

        {/* ── III. Daftar Berkas ── */}
        <DocSection>
          <SectionHead
            num="III"
            title="Daftar Kelengkapan Berkas"
            right={`${siapWajib}/${totalWajib} wajib siap (${kelengkapanPct}%) · ${siapTotal}/${berkasList.length} total`}
          />
          {berkasList.length === 0 ? (
            <p className="px-3 py-3 text-center text-[8.5pt] italic text-slate-400">
              Belum ada berkas yang diupload.
            </p>
          ) : (
            <table className="w-full border-collapse text-[8.5pt]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-8 px-2 py-1 text-left font-semibold text-slate-600">No</th>
                  <th className="w-28 px-2 py-1 text-left font-semibold text-slate-600">Kategori</th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-600">Nama Berkas</th>
                  <th className="w-14 px-2 py-1 text-center font-semibold text-slate-600">Wajib</th>
                  <th className="w-24 px-2 py-1 text-center font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {berkasList.map((b, i) => (
                  <tr
                    key={b.id}
                    className={`border-b border-slate-100 ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}
                  >
                    <td className="px-2 py-0.5 text-slate-400">{i + 1}</td>
                    <td className="px-2 py-0.5 font-medium text-slate-700">{b.kategori}</td>
                    <td className="px-2 py-0.5 text-slate-900">{b.nama}</td>
                    <td className="px-2 py-0.5 text-center text-slate-500">
                      {b.wajib ? "●" : "○"}
                    </td>
                    <td
                      className={`px-2 py-0.5 text-center font-semibold ${STATUS_COLOR[b.status]}`}
                    >
                      {STATUS_SYMBOL[b.status] ?? b.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DocSection>
      </div>

      {/* ── Signature Row ── */}
      <div className="mt-6 grid grid-cols-2 gap-12 ek-avoid-break">
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
