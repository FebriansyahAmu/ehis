"use client";

/**
 * Surat Pengantar Template — A4 formal letter (EK5.1).
 *
 * Digunakan sebagai surat resmi RS kepada BPJS Kesehatan untuk pengajuan batch klaim.
 * Format: surat dinas standar Indonesia — nomor surat, perihal, badan surat, tabel klaim, tanda tangan.
 *
 * Props:
 *   claim       — klaim utama (untuk single-claim preview)
 *   batchKlaims — optional batch list; defaults to [claim]
 */

import KopSuratEklaim from "./KopSuratEklaim";
import { formatRupiah } from "@/lib/eklaim/money";
import {
  fmtTipePelayanan,
  fmtDateShortDoc,
  todayLong,
  currentMonthYear,
} from "./berkasGeneratorShared";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";

// ── Subcomponents ──────────────────────────────────────

function SuratRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="w-[96px] py-0.5 text-[9.5pt] align-top text-slate-700">{label}</td>
      <td className="w-4 py-0.5 text-[9.5pt] align-top text-slate-500">:</td>
      <td className="py-0.5 text-[9.5pt] text-slate-900">{children}</td>
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────

interface Props {
  claim: ClaimRecord;
  batchKlaims?: ReadonlyArray<ClaimRecord>;
}

export default function SuratPengantarTemplate({ claim, batchKlaims }: Props) {
  const rs = RS_PROFIL_INITIAL;
  const klaims = batchKlaims ?? [claim];
  const today = fmtDateShortDoc(new Date().toISOString());
  const bulan = currentMonthYear();
  const year = new Date().getFullYear();
  const noSurat = `${rs.kode}/Klaim-BPJS/${String(klaims.length).padStart(3, "0")}/${year}`;

  const totalTarif = klaims.reduce<bigint>((acc, c) => {
    const tarif = c.iDRG?.tarifAktual ?? c.inaCbgLegacy?.tarif.kelas2 ?? 0n;
    return acc + tarif;
  }, 0n);

  return (
    <div className="w-[794px] min-h-[1123px] bg-white px-14 py-12 font-sans text-slate-900">
      <KopSuratEklaim variant="full" />

      {/* ── Nomor & Perihal ── */}
      <table className="mt-6 border-0" style={{ borderCollapse: "collapse" }}>
        <tbody>
          <SuratRow label="Nomor">{noSurat}</SuratRow>
          <SuratRow label="Lampiran">
            {klaims.length} ({klaims.length === 1 ? "satu" : `${klaims.length}`}) berkas klaim
          </SuratRow>
          <SuratRow label="Perihal">
            <strong>Pengajuan Klaim BPJS — Bulan {bulan}</strong>
          </SuratRow>
        </tbody>
      </table>

      {/* ── Recipient ── */}
      <div className="mt-6 text-[9.5pt]">
        <p className="font-semibold">Kepada Yth,</p>
        <p>Kepala Bidang Penjaminan Manfaat Rujukan</p>
        <p className="font-semibold">BPJS Kesehatan Kantor Cabang</p>
        <p>{rs.alamat.kota}</p>
        <p className="mt-1">
          di &nbsp;—&nbsp; <em>Tempat</em>
        </p>
      </div>

      {/* ── Salutation ── */}
      <div className="mt-5 text-[9.5pt] leading-relaxed">
        <p>Dengan hormat,</p>
      </div>

      {/* ── Body ── */}
      <div className="mt-3 space-y-3 text-[9.5pt] leading-[1.7]">
        <p>
          Sehubungan dengan pelaksanaan Program Jaminan Kesehatan Nasional (JKN)
          sesuai ketentuan <strong>Permenkes 76/2016</strong> dan{" "}
          <strong>Perpres 82/2018</strong>, bersama ini kami sampaikan pengajuan klaim
          atas pelayanan kesehatan yang telah diberikan kepada peserta BPJS Kesehatan
          selama bulan <strong>{bulan}</strong>.
        </p>
        <p>
          Berkas klaim yang kami lampirkan telah dikoding sesuai{" "}
          <strong>Pedoman Pengodean iDRG 2025 Kementerian Kesehatan</strong> dengan
          standar ICD-10-IM dan ICD-9-CM-IM (Indonesian Coding Standard v1), serta
          telah melalui proses verifikasi internal oleh Tim Koder Rekam Medis dan
          Verifikator Internal Rumah Sakit.
        </p>
        <p>Berikut adalah daftar klaim yang kami ajukan:</p>
      </div>

      {/* ── Claim Table ── */}
      <table className="mt-3 w-full border-collapse text-[8.5pt]">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-2 py-1.5 text-left font-semibold text-slate-700 w-7">
              No
            </th>
            <th className="border border-slate-300 px-2 py-1.5 text-left font-semibold text-slate-700 w-36">
              No. Klaim
            </th>
            <th className="border border-slate-300 px-2 py-1.5 text-left font-semibold text-slate-700">
              Diagnosa Primer (ICD-10-IM)
            </th>
            <th className="border border-slate-300 px-2 py-1.5 text-center font-semibold text-slate-700 w-20">
              Jenis
            </th>
            <th className="border border-slate-300 px-2 py-1.5 text-center font-semibold text-slate-700 w-24">
              Grouper
            </th>
            <th className="border border-slate-300 px-2 py-1.5 text-right font-semibold text-slate-700 w-28">
              Tarif (Rp)
            </th>
          </tr>
        </thead>
        <tbody>
          {klaims.map((c, i) => {
            const tarif = c.iDRG?.tarifAktual ?? c.inaCbgLegacy?.tarif.kelas2 ?? 0n;
            const grouperCode =
              c.eraGrouper === "iDRG"
                ? `iDRG ${c.iDRG?.code ?? "—"}`
                : `CBG ${c.inaCbgLegacy?.code ?? "—"}`;
            return (
              <tr
                key={c.id}
                className={`border-b border-slate-200 ${i % 2 === 1 ? "bg-slate-50/60" : ""}`}
              >
                <td className="border-r border-slate-200 px-2 py-0.5 text-slate-400">
                  {i + 1}
                </td>
                <td className="border-r border-slate-200 px-2 py-0.5 font-mono text-[8pt]">
                  {c.noKlaim}
                </td>
                <td className="border-r border-slate-200 px-2 py-0.5">
                  <span className="font-mono font-bold text-teal-700">
                    {c.diagnosaPrimer.kode}
                  </span>{" "}
                  <span className="text-slate-700">{c.diagnosaPrimer.deskripsi}</span>
                </td>
                <td className="border-r border-slate-200 px-2 py-0.5 text-center text-slate-700">
                  {fmtTipePelayanan(c.tipePelayanan)}
                </td>
                <td className="border-r border-slate-200 px-2 py-0.5 text-center font-mono text-[8pt]">
                  {grouperCode}
                </td>
                <td className="px-2 py-0.5 text-right font-mono font-semibold text-slate-900">
                  {formatRupiah(tarif)}
                </td>
              </tr>
            );
          })}
          {/* Total row */}
          <tr className="bg-slate-100 font-bold">
            <td colSpan={5} className="border-r border-slate-300 px-2 py-1.5 text-right">
              Total ({klaims.length} klaim)
            </td>
            <td className="px-2 py-1.5 text-right font-mono text-emerald-700">
              {formatRupiah(totalTarif)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Closing + Signature (kept together on same page) ── */}
      <div className="ek-avoid-break">
      {/* ── Closing ── */}
      <div className="mt-4 space-y-3 text-[9.5pt] leading-[1.7]">
        <p>
          Demikian pengajuan klaim ini kami sampaikan. Kami mohon kiranya dapat
          diproses sesuai ketentuan dan prosedur yang berlaku. Atas perhatian serta
          kerja sama yang baik dari Bapak/Ibu, kami mengucapkan terima kasih.
        </p>
      </div>

      {/* ── Signature (right-aligned) ── */}
      <div className="mt-6 flex justify-end">
        <div className="w-60 text-center">
          <p className="text-[9pt] text-slate-600">
            {rs.alamat.kota}, {today}
          </p>
          <p className="text-[9pt] font-bold text-slate-800">{rs.nama}</p>
          <p className="text-[9pt] text-slate-600">Kepala Tim Klaim</p>
          <div className="mt-14 border-b border-slate-800" />
          <p className="mt-1 text-[8.5pt] font-semibold text-slate-700">
            {rs.kop.namaKepala ?? "(Nama Pejabat)"}
          </p>
          {rs.kop.nipKepala && (
            <p className="text-[8pt] text-slate-500">NIP. {rs.kop.nipKepala}</p>
          )}
        </div>
      </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-8 border-t border-slate-200 pt-2 text-center text-[7.5pt] text-slate-400">
        Dokumen ini digenerate oleh EHIS E-Klaim &nbsp;·&nbsp; {todayLong()} &nbsp;·&nbsp; {rs.nama}
      </div>
    </div>
  );
}
