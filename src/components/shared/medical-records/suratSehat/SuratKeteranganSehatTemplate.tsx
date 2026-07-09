"use client";

// Template cetak SURAT KETERANGAN SEHAT (A4) — SHARED. Sumber data = medicalrecord.
// SuratKeteranganSehat (nomor SKH-… + blok hasil pemeriksaan fisik) via adapter SuratSehatCetakData.
// Layout surat resmi: KOP RS · nomor · identitas pasien · tabel hasil pemeriksaan (antropometri +
// IMT + tanda vital + golongan darah + penglihatan/buta warna/pendengaran) · kesimpulan "SEHAT" ·
// keperluan · penutup · TTE Dokter Pemeriksa (QR). Light tones (printer-friendly). Dipakai di dalam
// `.print-area` oleh modal.

import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import TteQr from "@/components/shared/TteQr";

// ── Data contract (adapter dari SuratSehatDTO / mock demo) ───────────────────

/** TTE Dokter Pemeriksa (null = terbit tanpa TTE → cetak pakai TTD manual). */
export interface SuratSehatTte {
  serial: string;
  signedBy: string;
  signedAt: string; // display
}

export interface SuratSehatCetakData {
  surat: {
    nomor: string;             // SKH-<YYMM><NNN> — "" bila demo/lokal
    tglPeriksa: string;        // "YYYY-MM-DD"
    tinggiBadan: number | null;
    beratBadan: number | null;
    tekananDarah: string;
    nadi: number | null;
    golonganDarah: string;
    penglihatan: string;
    butaWarna: string;
    pendengaran: string;
    riwayatPenyakit: string;
    kesimpulan: string;        // Sehat | Sehat dengan Catatan | Tidak Sehat
    keperluan?: string;
    instansi?: string;         // ditujukan kepada
    berlakuHingga?: string;    // "YYYY-MM-DD" (opsional)
    catatan?: string;
    pekerjaan?: string;
    pencatat?: string;
    terbitAt?: string;         // ISO createdAt
  };
  pasien: {
    nama: string;
    noRM: string;
    gender: "L" | "P";
    umur: string;              // "34 tahun"
    tanggalLahir?: string;
    alamat?: string;
  };
  /** Penanda tangan (dokter pemeriksa). */
  dokter: string;
  /** TTE Dokter Pemeriksa — QR pada cetakan. null/absen = TTD manual. */
  tte?: SuratSehatTte | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTglPendek(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd || "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function fmtWaktu(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Kategori IMT (WHO Asia-Pasifik ringkas). */
function bmiKategori(bmi: number): string {
  if (bmi < 18.5) return "Kurang";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Berlebih";
  return "Obesitas";
}

function FR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="w-40 py-[2px] align-top text-[9pt] text-slate-500">{label}</td>
      <td className="w-3 py-[2px] align-top text-[8.5pt] text-slate-400">:</td>
      <td className="py-[2px] text-[9pt] font-medium text-slate-800">{children}</td>
    </tr>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function SuratKeteranganSehatTemplate({ data }: { data: SuratSehatCetakData }) {
  const rs = RS_PROFIL_INITIAL;
  const { surat, pasien, dokter, tte } = data;

  const bmi = surat.tinggiBadan && surat.beratBadan && surat.tinggiBadan > 0
    ? surat.beratBadan / (surat.tinggiBadan / 100) ** 2
    : null;

  const examRows: [string, string][] = [
    surat.tinggiBadan != null ? ["Tinggi Badan", `${surat.tinggiBadan} cm`] : null,
    surat.beratBadan != null ? ["Berat Badan", `${surat.beratBadan} kg`] : null,
    bmi != null ? ["Indeks Massa Tubuh", `${bmi.toFixed(1)} kg/m² · ${bmiKategori(bmi)}`] : null,
    surat.tekananDarah.trim() ? ["Tekanan Darah", `${surat.tekananDarah} mmHg`] : null,
    surat.nadi != null ? ["Nadi", `${surat.nadi} x/menit`] : null,
    surat.golonganDarah.trim() ? ["Golongan Darah", surat.golonganDarah] : null,
    surat.penglihatan.trim() ? ["Penglihatan / Mata", surat.penglihatan] : null,
    surat.butaWarna.trim() ? ["Tes Buta Warna", surat.butaWarna] : null,
    surat.pendengaran.trim() ? ["Pendengaran", surat.pendengaran] : null,
    surat.riwayatPenyakit.trim() ? ["Riwayat Penyakit", surat.riwayatPenyakit] : null,
  ].filter((r): r is [string, string] => r !== null);

  const kesimpulan = surat.kesimpulan?.trim() || "Sehat";
  const tglTerbit = surat.terbitAt
    ? new Date(surat.terbitAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const qrPayload = tte
    ? `EHIS-SKH|${surat.nomor || "-"}|${pasien.noRM}|${tte.signedBy}|${tte.signedAt}|${tte.serial}`
    : "";

  return (
    <div className="flex min-h-full w-full flex-col bg-white px-12 py-9 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      {/* ── Judul + nomor ── */}
      <div className="mt-4 text-center">
        <h2 className="text-[13pt] font-bold uppercase tracking-[0.28em] text-slate-900 underline decoration-2 underline-offset-4">
          Surat Keterangan Sehat
        </h2>
        <p className="mt-1 text-[9pt] text-slate-600">
          Nomor: <span className="font-mono font-bold tracking-wider text-slate-800">{surat.nomor || "—"}</span>
        </p>
      </div>

      {/* ── Pembuka ── */}
      <p className="mt-4 text-[9.5pt] leading-relaxed text-slate-700">
        Yang bertanda tangan di bawah ini, Dokter Pemeriksa pada {rs.nama}, menerangkan bahwa
        berdasarkan hasil pemeriksaan kesehatan pada tanggal{" "}
        <span className="font-semibold">{fmtTglPendek(surat.tglPeriksa)}</span>, pasien:
      </p>

      {/* ── Identitas pasien ── */}
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/60 px-5 py-3">
        <table style={{ borderCollapse: "collapse" }} className="w-full">
          <tbody>
            <FR label="Nama Pasien"><span className="font-bold">{pasien.nama}</span></FR>
            <FR label="No. Rekam Medis"><span className="font-mono font-semibold">{pasien.noRM}</span></FR>
            <FR label="Jenis Kelamin">{pasien.gender === "L" ? "Laki-laki" : "Perempuan"}</FR>
            {pasien.tanggalLahir && <FR label="Tanggal Lahir">{pasien.tanggalLahir} ({pasien.umur})</FR>}
            {!pasien.tanggalLahir && <FR label="Umur">{pasien.umur}</FR>}
            {surat.pekerjaan?.trim() && <FR label="Pekerjaan">{surat.pekerjaan}</FR>}
            {pasien.alamat && <FR label="Alamat">{pasien.alamat}</FR>}
          </tbody>
        </table>
      </div>

      {/* ── Hasil pemeriksaan fisik ── */}
      {examRows.length > 0 && (
        <div className="page-break-avoid mt-3 overflow-hidden rounded-xl border-2 border-emerald-600">
          <div className="bg-emerald-600 px-5 py-1.5 text-center text-[8pt] font-bold uppercase tracking-[0.25em] text-white">
            Hasil Pemeriksaan
          </div>
          <table className="w-full bg-emerald-50/40" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {examRows.map(([label, value], i) => (
                <tr key={label} className={i % 2 === 1 ? "bg-white/50" : ""}>
                  <td className="w-56 border-b border-emerald-100 px-5 py-1.5 align-top text-[9pt] font-semibold text-emerald-800">{label}</td>
                  <td className="border-b border-emerald-100 px-3 py-1.5 text-[9pt] text-slate-800">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Kesimpulan ── */}
      <div className="page-break-avoid mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 text-center">
        <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-emerald-700/70">Kesimpulan</p>
        <p className="mt-0.5 text-[11pt] font-bold uppercase tracking-wide text-emerald-800">{kesimpulan}</p>
        <p className="mt-1 text-[9pt] leading-relaxed text-slate-700">
          Berdasarkan hasil pemeriksaan tersebut, yang bersangkutan dinyatakan
          {" "}<span className="font-semibold">{kesimpulan.toLowerCase()}</span> secara jasmani.
        </p>
      </div>

      {/* ── Keperluan / ditujukan kepada / masa berlaku ── */}
      {(surat.keperluan?.trim() || surat.instansi?.trim() || surat.berlakuHingga?.trim()) && (
        <p className="mt-3 text-[9.5pt] leading-relaxed text-slate-700">
          {surat.keperluan?.trim() && (
            <>Surat keterangan ini dibuat untuk keperluan <span className="font-semibold">{surat.keperluan}</span></>
          )}
          {surat.instansi?.trim() && (
            <> dan ditujukan kepada <span className="font-semibold">{surat.instansi}</span></>
          )}
          {surat.keperluan?.trim() && "."}
          {surat.berlakuHingga?.trim() && (
            <> Surat berlaku hingga <span className="font-semibold">{fmtTglPendek(surat.berlakuHingga)}</span>.</>
          )}
        </p>
      )}

      {/* ── Catatan dokter ── */}
      {surat.catatan?.trim() && (
        <div className="page-break-avoid mt-3">
          <p className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-400">Catatan Dokter</p>
          <p className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-200 px-4 py-2 text-[9pt] leading-relaxed text-slate-700">
            {surat.catatan}
          </p>
        </div>
      )}

      {/* ── Penutup ── */}
      <p className="mt-3 text-[9.5pt] leading-relaxed text-slate-700">
        Demikian surat keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
      </p>

      {/* ── Tanda tangan (TTE QR bila ditandatangani, else TTD manual) ── */}
      <div className="page-break-avoid mt-6 flex items-end justify-between gap-6">
        <div className="text-[7.5pt] leading-relaxed text-slate-400">
          {tte && (
            <>
              <p>Dokumen ini ditandatangani secara elektronik dan sah tanpa tanda tangan basah</p>
              <p>sesuai UU ITE No. 11/2008 Pasal 11 tentang Tanda Tangan Elektronik.</p>
            </>
          )}
        </div>

        <div className="shrink-0 text-center">
          <p className="text-[9pt] text-slate-600">{rs.alamat.kota}, {tte ? tte.signedAt : tglTerbit}</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Dokter Pemeriksa</p>

          {tte ? (
            <div className="mt-1.5 inline-flex flex-col items-center rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-2.5">
              <TteQr value={qrPayload} size={84} />
              <p className="mt-1 font-mono text-[7.5pt] font-bold tracking-wider text-emerald-800">{tte.serial}</p>
              <p className="mt-0.5 text-[8.5pt] font-bold text-slate-800">{tte.signedBy}</p>
              <p className="text-[7pt] text-emerald-700">Ditandatangani secara elektronik</p>
            </div>
          ) : (
            <>
              <div className="mx-8 mt-14 border-b border-slate-800" />
              <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">{dokter || "—"}</p>
            </>
          )}
        </div>
      </div>

      {/* ── Footer meta ── */}
      <div className="mt-auto border-t border-slate-200 pt-2 text-center text-[7.5pt] text-slate-400">
        Diterbitkan melalui EHIS &nbsp;·&nbsp; {fmtWaktu(surat.terbitAt)}
        {surat.pencatat && <> &nbsp;·&nbsp; Pencatat: {surat.pencatat}</>}
        &nbsp;·&nbsp; {rs.nama}
      </div>
    </div>
  );
}
