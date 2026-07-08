"use client";

// Template cetak SURAT KETERANGAN SAKIT (A4) — SHARED. Sumber data = medicalrecord.
// SuratKeteranganSakit (nomor SKS-… + periode istirahat) via adapter SuratSakitCetakData.
// Layout surat resmi: KOP RS · nomor · identitas pasien · keterangan istirahat highlight
// (lama hari + terbilang) · diagnosis (bila dicantumkan — rahasia medis) · keperluan · penutup ·
// TTD Dokter Pemeriksa. Light tones (printer-friendly). Dipakai di dalam `.print-area` oleh modal.

import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import TteQr from "@/components/shared/TteQr";

// ── Data contract (adapter dari SuratSakitDTO / mock demo) ───────────────────

/** TTE Dokter Pemeriksa (null = terbit tanpa TTE → cetak pakai TTD manual). */
export interface SuratSakitTte {
  serial: string;
  signedBy: string;
  signedAt: string; // display
}

export interface SuratSakitCetakData {
  surat: {
    nomor: string;             // SKS-<YYMM><NNN> — "" bila demo/lokal
    tglPeriksa: string;        // "YYYY-MM-DD"
    tglMulai: string;
    tglSelesai: string;
    lamaHari: number;
    keperluan?: string;        // Istirahat Bekerja | Sekolah | Pemulihan | Lainnya
    diagnosa?: string;
    cantumkanDiagnosa?: boolean;
    pekerjaan?: string;
    instansi?: string;         // ditujukan kepada
    catatan?: string;
    pencatat?: string;
    terbitAt?: string;         // ISO createdAt
  };
  pasien: {
    nama: string;
    noRM: string;
    gender: "L" | "P";
    umur: string;              // "67 tahun"
    tanggalLahir?: string;
    alamat?: string;
  };
  /** Penanda tangan (dokter pemeriksa). */
  dokter: string;
  /** TTE Dokter Pemeriksa — QR pada cetakan. null/absen = TTD manual. */
  tte?: SuratSakitTte | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTglLong(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd || "—";
  return d.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

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

/** Angka → terbilang Indonesia (cukup untuk lama hari 1–365). */
function terbilang(n: number): string {
  const sat = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  if (n <= 0) return "nol";
  if (n < 12) return sat[n];
  if (n < 20) return `${terbilang(n - 10)} belas`;
  if (n < 100) return `${terbilang(Math.floor(n / 10))} puluh${n % 10 ? ` ${terbilang(n % 10)}` : ""}`;
  if (n < 200) return `seratus${n - 100 ? ` ${terbilang(n - 100)}` : ""}`;
  if (n < 1000) return `${terbilang(Math.floor(n / 100))} ratus${n % 100 ? ` ${terbilang(n % 100)}` : ""}`;
  if (n < 2000) return `seribu${n - 1000 ? ` ${terbilang(n - 1000)}` : ""}`;
  return `${terbilang(Math.floor(n / 1000))} ribu${n % 1000 ? ` ${terbilang(n % 1000)}` : ""}`;
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

export default function SuratKeteranganSakitTemplate({ data }: { data: SuratSakitCetakData }) {
  const rs = RS_PROFIL_INITIAL;
  const { surat, pasien, dokter, tte } = data;
  const showDiagnosa = !!surat.cantumkanDiagnosa && !!surat.diagnosa?.trim();
  const tglTerbit = surat.terbitAt
    ? new Date(surat.terbitAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const qrPayload = tte
    ? `EHIS-SKS|${surat.nomor || "-"}|${pasien.noRM}|${tte.signedBy}|${tte.signedAt}|${tte.serial}`
    : "";

  return (
    <div className="flex min-h-full w-full flex-col bg-white px-12 py-9 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      {/* ── Judul + nomor ── */}
      <div className="mt-4 text-center">
        <h2 className="text-[13pt] font-bold uppercase tracking-[0.28em] text-slate-900 underline decoration-2 underline-offset-4">
          Surat Keterangan Sakit
        </h2>
        <p className="mt-1 text-[9pt] text-slate-600">
          Nomor: <span className="font-mono font-bold tracking-wider text-slate-800">{surat.nomor || "—"}</span>
        </p>
      </div>

      {/* ── Pembuka ── */}
      <p className="mt-4 text-[9.5pt] leading-relaxed text-slate-700">
        Yang bertanda tangan di bawah ini, Dokter Pemeriksa pada {rs.nama}, menerangkan bahwa
        berdasarkan hasil pemeriksaan pada tanggal{" "}
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

      {/* ── Diagnosis (rahasia medis — hanya bila dicantumkan) ── */}
      {showDiagnosa && (
        <p className="mt-3 text-[9.5pt] leading-relaxed text-slate-700">
          Didiagnosis menderita <span className="font-semibold">{surat.diagnosa}</span>,
          sehingga yang bersangkutan dalam keadaan <span className="font-semibold">sakit</span> dan
          perlu beristirahat untuk pemulihan selama:
        </p>
      )}
      {!showDiagnosa && (
        <p className="mt-3 text-[9.5pt] leading-relaxed text-slate-700">
          Pada saat pemeriksaan berada dalam keadaan <span className="font-semibold">sakit</span> dan
          perlu beristirahat untuk pemulihan selama:
        </p>
      )}

      {/* ── Keterangan istirahat — highlight ── */}
      <div className="page-break-avoid mt-3 overflow-hidden rounded-xl border-2 border-rose-600">
        <div className="bg-rose-600 px-5 py-1.5 text-center text-[8pt] font-bold uppercase tracking-[0.25em] text-white">
          Istirahat / Tidak Dapat Bekerja
        </div>
        <div className="grid grid-cols-3 divide-x divide-rose-100 bg-rose-50/50">
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-rose-700/70">Lama Istirahat</p>
            <p className="mt-1 text-[13pt] font-bold leading-none text-slate-900">{surat.lamaHari} hari</p>
            <p className="mt-1 text-[8pt] capitalize italic text-slate-500">({terbilang(surat.lamaHari)} hari)</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-rose-700/70">Terhitung Mulai</p>
            <p className="mt-1 text-[10pt] font-bold leading-snug text-slate-900">{fmtTglLong(surat.tglMulai)}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-rose-700/70">Sampai Dengan</p>
            <p className="mt-1 text-[10pt] font-bold leading-snug text-slate-900">{fmtTglLong(surat.tglSelesai)}</p>
          </div>
        </div>
      </div>

      {/* ── Keperluan / ditujukan kepada ── */}
      {(surat.keperluan?.trim() || surat.instansi?.trim()) && (
        <p className="mt-3 text-[9.5pt] leading-relaxed text-slate-700">
          Surat keterangan ini dibuat untuk keperluan{" "}
          <span className="font-semibold">{surat.keperluan?.trim() || "istirahat pemulihan"}</span>
          {surat.instansi?.trim() && (
            <> dan ditujukan kepada <span className="font-semibold">{surat.instansi}</span></>
          )}.
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
            <div className="mt-1.5 inline-flex flex-col items-center rounded-lg border border-rose-200 bg-rose-50/60 px-4 py-2.5">
              <TteQr value={qrPayload} size={84} />
              <p className="mt-1 font-mono text-[7.5pt] font-bold tracking-wider text-rose-800">{tte.serial}</p>
              <p className="mt-0.5 text-[8.5pt] font-bold text-slate-800">{tte.signedBy}</p>
              <p className="text-[7pt] text-rose-700">Ditandatangani secara elektronik</p>
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
