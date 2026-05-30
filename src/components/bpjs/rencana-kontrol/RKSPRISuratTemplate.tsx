"use client";

/**
 * RK/SPRI Surat Template — A4 KOP RS (BP8.4 / BP6.8).
 *
 * Dokumen cetak Rencana Kontrol (RK) atau Surat Pengantar Rawat Inap (SPRI).
 * Props: rk: RKDetailRecord — dari getNoSuratKontrol(noSurat).
 * SPRI (jnsKontrol="1"): sep null — tampilkan noSuratKontrol + poli/dokter + PRB.
 * Kontrol (jnsKontrol="2"): sep terisi — tampilkan info SEP asal + peserta.
 */

import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import type { RKDetailRecord } from "@/lib/bpjs/bpjsContracts";
import { PRB_LABELS } from "@/lib/bpjs/bpjsContracts";
import { fmtTgl } from "@/components/bpjs/sep/sepShared";
import { fmtDateShortDoc, todayLong } from "@/components/eklaim/berkas/berkasGeneratorShared";

// ── PRB display helpers ───────────────────────────────────

const PRB_FIELD_LABELS: Partial<Record<string, string>> = {
  HBA1C:          "HbA1c (%)",
  GDP:            "Gula Darah Puasa (mg/dL)",
  GD2JPP:         "GD 2j Post-Prandial (mg/dL)",
  eGFR:           "eGFR (mL/min)",
  TD_Sistolik:    "TD Sistolik (mmHg)",
  TD_Diastolik:   "TD Diastolik (mmHg)",
  LDL:            "LDL (mg/dL)",
  NadiIstirahat:  "Nadi Istirahat (bpm)",
  FungsiParu:     "Fungsi Paru (%)",
  SkorMMRC:       "Skor mMRC",
  Remisi:         "Remisi (%)",
  RemisiSLE:      "Remisi SLE (%)",
  AsamUrat:       "Asam Urat (mg/dL)",
  Usia:           "Usia (tahun)",
};

function getNonNullPRBFields(data: Record<string, number | null>): { key: string; label: string; value: number }[] {
  return Object.entries(data)
    .filter(([, v]) => v !== null && typeof v === "number")
    .map(([k, v]) => ({
      key: k,
      label: PRB_FIELD_LABELS[k] ?? k,
      value: v as number,
    }))
    .slice(0, 12);
}

// ── Sub-components ────────────────────────────────────────

function FR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="w-44 py-[2px] align-top text-[9pt] text-slate-500">{label}</td>
      <td className="w-3 py-[2px] align-top text-[8.5pt] text-slate-400">:</td>
      <td className="py-[2px] text-[9pt] font-medium text-slate-800">{children}</td>
    </tr>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 mt-3.5 text-[7.5pt] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

// ── Main ──────────────────────────────────────────────────

interface Props {
  rk: RKDetailRecord;
}

export default function RKSPRISuratTemplate({ rk }: Props) {
  const rs = RS_PROFIL_INITIAL;
  const today = fmtDateShortDoc(new Date().toISOString());
  const isSPRI = rk.jnsKontrol === "1";
  const title = isSPRI
    ? "Surat Pengantar Rawat Inap (SPRI)"
    : "Surat Rencana Kontrol (RK)";
  const accentCls = isSPRI ? "border-violet-700 text-violet-800" : "border-emerald-700 text-emerald-800";
  const bgCls = isSPRI ? "bg-violet-50 border-violet-200 text-violet-900" : "bg-emerald-50 border-emerald-200 text-emerald-900";

  const peserta = rk.sep?.peserta ?? null;
  const prbNonNull = getNonNullPRBFields(rk.formPRB.data as unknown as Record<string, number | null>);

  return (
    <div className="w-[794px] min-h-[1123px] bg-white px-14 py-10 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      {/* ── Title bar ── */}
      <div className={`mt-4 border-b-[2.5px] border-double pb-1.5 text-center ${accentCls}`}>
        <h2 className="text-[12pt] font-bold uppercase tracking-widest">
          {title}
        </h2>
        <p className="text-[8pt] text-slate-500">{rs.nama}</p>
      </div>

      {/* ── No. Surat prominent ── */}
      <div className={`mt-3 flex items-center justify-between rounded-xl border px-4 py-2.5 ${bgCls}`}>
        <div>
          <p className="text-[7.5pt] font-semibold uppercase tracking-wider opacity-70">
            No. Surat Kontrol
          </p>
          <p className="mt-0.5 font-mono text-[12pt] font-bold tracking-widest">
            {rk.noSuratKontrol}
          </p>
        </div>
        <div className="text-right text-[9pt]">
          <p className="text-slate-500">Jenis</p>
          <p className="font-bold">{rk.namaJnsKontrol.toUpperCase()}</p>
        </div>
      </div>

      {/* ── 2-col: Surat + Poli & Dokter ── */}
      <div className="mt-3 grid grid-cols-2 gap-x-10">
        <div>
          <SectionHead>Data Surat</SectionHead>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <FR label="Tanggal Terbit">{fmtTgl(rk.tglTerbit)}</FR>
              <FR label="Tgl. Rencana Kontrol">{fmtTgl(rk.tglRencanaKontrol)}</FR>
              <FR label="Jenis Kontrol">{rk.namaJnsKontrol}</FR>
              <FR label="Flag Kontrol">{rk.flagKontrol === "True" ? "Ya" : "Tidak"}</FR>
            </tbody>
          </table>
        </div>
        <div>
          <SectionHead>Poli &amp; Dokter</SectionHead>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <FR label="Poli Tujuan">
                <span className="font-mono font-bold">{rk.poliTujuan}</span>{" "}
                <span className="text-slate-600">{rk.namaPoliTujuan}</span>
              </FR>
              <FR label="Dokter DPJP">
                <span className="font-mono font-bold">{rk.kodeDokter}</span>{" "}
                <span className="text-slate-600">{rk.namaDokter}</span>
              </FR>
              <FR label="Diterbitkan oleh">
                <span className="font-mono">{rk.kodeDokterPembuat}</span>{" "}
                <span className="text-slate-600">{rk.namaDokterPembuat}</span>
              </FR>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SEP Asal (Kontrol only) ── */}
      {!isSPRI && rk.sep && (
        <>
          <SectionHead>SEP Asal</SectionHead>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <FR label="No. SEP Asal">
                <span className="font-mono font-bold text-emerald-700">{rk.sep.noSep}</span>
              </FR>
              <FR label="Tgl. SEP">{fmtTgl(rk.sep.tglSep)}</FR>
              <FR label="Jenis Pelayanan">{rk.sep.jnsPelayanan}</FR>
              <FR label="Poli">{rk.sep.poli}</FR>
              <FR label="Diagnosa">{rk.sep.diagnosa}</FR>
            </tbody>
          </table>
        </>
      )}

      {/* ── Peserta ── */}
      {peserta && (
        <>
          <SectionHead>Data Peserta</SectionHead>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <FR label="No. Kartu BPJS">
                <span className="font-mono font-bold tracking-wider">{peserta.noKartu}</span>
              </FR>
              <FR label="Nama Peserta">{peserta.nama}</FR>
              <FR label="Tanggal Lahir">{fmtTgl(peserta.tglLahir)}</FR>
              <FR label="Jenis Kelamin">{peserta.kelamin === "L" ? "Laki-laki" : "Perempuan"}</FR>
              <FR label="Hak Kelas">{peserta.hakKelas}</FR>
            </tbody>
          </table>
        </>
      )}

      {/* ── PRB Status ── */}
      {rk.formPRB.kdStatusPRB && (
        <>
          <SectionHead>Program Rujuk Balik (PRB)</SectionHead>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet-100 px-3 py-0.5 text-[9pt] font-bold text-violet-700">
                {rk.formPRB.kdStatusPRB}
              </span>
              <span className="text-[9.5pt] font-semibold text-slate-700">
                {PRB_LABELS[rk.formPRB.kdStatusPRB]}
              </span>
            </div>

            {prbNonNull.length > 0 && (
              <table className="mt-2 w-full border-collapse text-[8pt]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-0.5 text-left text-[7.5pt] font-semibold uppercase tracking-wider text-slate-400">
                      Parameter
                    </th>
                    <th className="py-0.5 text-right text-[7.5pt] font-semibold uppercase tracking-wider text-slate-400">
                      Nilai
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prbNonNull.map(({ key, label, value }) => (
                    <tr key={key}>
                      <td className="py-0.5 text-slate-600">{label}</td>
                      <td className="py-0.5 text-right font-mono font-semibold text-slate-800">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Tanda Tangan 2-col ── */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">{rs.alamat.kota}, {today}</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Dokter Penerbit</p>
          <div className="mt-12 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">{rk.namaDokterPembuat}</p>
          <p className="text-[8pt] text-slate-400">Kode: {rk.kodeDokterPembuat}</p>
        </div>
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">{rs.alamat.kota}, {today}</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Petugas BPJS RS</p>
          <div className="mt-12 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] text-slate-500">( ........................................ )</p>
          <p className="text-[8pt] text-slate-400">NIP / NIK</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-6 border-t border-slate-200 pt-2 text-center text-[7.5pt] text-slate-400">
        Diterbitkan oleh EHIS BPJS &nbsp;·&nbsp; {todayLong()} &nbsp;·&nbsp; {rs.nama}
      </div>
    </div>
  );
}
