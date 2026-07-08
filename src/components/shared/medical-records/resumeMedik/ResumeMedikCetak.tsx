"use client";

// Resume Medik Cetak — SHARED (RI · RJ). Modal preview + template A4 (KOP RS) + blok TTE QR.
// Model NORMALIZED (ResumeMedikPrintModel) — dibangun pane RI/RJ; `konteks` menyetel judul,
// label periode, judul narasi/TTV, dan label penanda tangan. Modal pola ResepCetakModal (infra
// print global: `.print-area` isolasi + `.no-print`). TTE: QR deterministik payload EHIS-RESMED
// (shared TteQr, pola Lab/Rad); serial dari server (tteToken) — demo pakai serial derivatif.

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, ShieldCheck } from "lucide-react";
import type { IGDDiagnosa } from "@/lib/data";
import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import TteQr from "@/components/shared/TteQr";
import type { ResumeMedikData } from "./resumeMedikTypes";

export interface ResumeMedikTte {
  serial: string;
  signedBy: string;
  signedAt: string; // display
}

export interface PeriodeRow { label: string; value: string; strong?: boolean }

export interface ResumeMedikPrintModel {
  konteks: "ri" | "rj";
  pasien: {
    nama: string; noRM: string; umur: string; gender: "L" | "P";
    penjamin: string; tanggalLahir?: string; alamat?: string; noBpjs?: string;
  };
  periodeTitle: string;        // "Periode Perawatan" / "Data Kunjungan"
  periodeRows: PeriodeRow[];
  rm: ResumeMedikData;         // narasi + aggregates
  diagnosa: IGDDiagnosa[];
  noKunjungan: string;         // footer + payload TTE
  dpjp: string;                // nama penanda tangan
  tte: ResumeMedikTte | null;  // null = belum ditandatangani
}

interface Props {
  open: boolean;
  onClose: () => void;
  model: ResumeMedikPrintModel;
}

const FLAG_LABEL: Record<string, string> = {
  kritis: "KRITIS", tinggi: "Tinggi (H)", rendah: "Rendah (L)", normal: "Normal",
};

function Sec({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <section className="page-break-avoid mt-3">
      <p className="border-b border-slate-300 pb-0.5 text-[8pt] font-bold uppercase tracking-wider text-slate-600">
        {no}. {title}
      </p>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

function FR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="w-36 py-[1.5px] align-top text-[8.5pt] text-slate-500">{label}</td>
      <td className="w-3 py-[1.5px] align-top text-[8pt] text-slate-400">:</td>
      <td className="py-[1.5px] text-[8.5pt] font-medium text-slate-800">{children}</td>
    </tr>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`py-0.5 text-[7.5pt] font-bold uppercase tracking-wider text-slate-500 ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

// ── Template A4 ───────────────────────────────────────────────────────────────

function ResumeMedikTemplate({ model }: { model: ResumeMedikPrintModel }) {
  const rs = RS_PROFIL_INITIAL;
  const { konteks, pasien, periodeTitle, periodeRows, rm, diagnosa, noKunjungan, dpjp, tte } = model;
  const isRJ = konteks === "rj";
  const diagnosaPrimer = diagnosa.find(d => d.tipe === "Utama");
  const diagnosaLain   = diagnosa.filter(d => d.tipe !== "Utama");

  const judul = isRJ ? "Resume Medik Rawat Jalan" : "Resume Medik Rawat Inap";
  const dpjpLabel = isRJ ? "Dokter Pemeriksa" : "Dokter Penanggung Jawab (DPJP)";
  const ttvTitle = isRJ ? "Tanda-Tanda Vital Kunjungan" : "Tanda-Tanda Vital — Masuk vs Pulang";
  const ttvColMasuk = isRJ ? "Saat Datang" : "Masuk";
  const ttvColPulang = isRJ ? "Terkini" : "Pulang";
  const narasi: Array<[string, string, string]> = [
    ["IX", isRJ ? "Kondisi Saat Datang" : "Kondisi Saat Masuk", rm.kondisiMasuk],
    ["X", "Kondisi Saat Pulang", rm.kondisiPulang],
    ["XI", isRJ ? "Ringkasan Klinis (Dokter Pemeriksa)" : "Ringkasan Perjalanan Klinis (DPJP)", rm.ringkasanKlinis],
  ];

  const qrPayload = tte
    ? `EHIS-RESMED|${noKunjungan}|${pasien.noRM}|${tte.signedBy}|${tte.signedAt}|${tte.serial}`
    : "";

  const half = Math.ceil(periodeRows.length / 2);
  const periodeLeft = periodeRows.slice(0, half);
  const periodeRight = periodeRows.slice(half);

  const ttvRows: Array<[string, string, string]> = [
    ["Tekanan Darah (mmHg)", rm.ttvMasuk?.tekananDarah ?? "—", rm.ttvPulang?.tekananDarah ?? "—"],
    ["Nadi (×/mnt)",         String(rm.ttvMasuk?.nadi ?? "—"), String(rm.ttvPulang?.nadi ?? "—")],
    ["Respirasi (×/mnt)",    String(rm.ttvMasuk?.rr ?? "—"),   String(rm.ttvPulang?.rr ?? "—")],
    ["Suhu (°C)",            String(rm.ttvMasuk?.suhu ?? "—"), String(rm.ttvPulang?.suhu ?? "—")],
    ["SpO₂ (%)",             String(rm.ttvMasuk?.spo2 ?? "—"), String(rm.ttvPulang?.spo2 ?? "—")],
    ["GCS",                  String(rm.ttvMasuk?.gcs ?? "—"),  String(rm.ttvPulang?.gcs ?? "—")],
    ["Kesadaran",            rm.ttvMasuk?.kesadaran ?? "—",    rm.ttvPulang?.kesadaran ?? "—"],
  ];

  return (
    <div className="flex min-h-full w-full flex-col bg-white px-11 py-8 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      {/* Judul */}
      <div className="mt-3 text-center">
        <h2 className="text-[12.5pt] font-bold uppercase tracking-[0.25em] text-slate-900 underline decoration-2 underline-offset-4">
          {judul}
        </h2>
        <p className="mt-0.5 text-[7.5pt] text-slate-500">
          Kelengkapan Rekam Medis · Dokumen Klaim BPJS · PMK 269/2008
        </p>
      </div>

      {/* I. Identitas */}
      <Sec no="I" title="Identitas Pasien">
        <div className="grid grid-cols-2 gap-x-8">
          <table style={{ borderCollapse: "collapse" }}><tbody>
            <FR label="Nama Pasien"><span className="font-bold">{pasien.nama}</span></FR>
            <FR label="No. Rekam Medis"><span className="font-mono font-semibold">{pasien.noRM}</span></FR>
            <FR label="Umur / JK">{pasien.umur} / {pasien.gender === "L" ? "Laki-laki" : "Perempuan"}</FR>
          </tbody></table>
          <table style={{ borderCollapse: "collapse" }}><tbody>
            <FR label="Penjamin">{pasien.penjamin}{pasien.noBpjs ? ` · ${pasien.noBpjs}` : ""}</FR>
            <FR label="Tanggal Lahir">{pasien.tanggalLahir || "—"}</FR>
            <FR label="Alamat">{pasien.alamat || "—"}</FR>
          </tbody></table>
        </div>
      </Sec>

      {/* II. Periode / Kunjungan */}
      <Sec no="II" title={periodeTitle}>
        <div className="grid grid-cols-2 gap-x-8">
          <table style={{ borderCollapse: "collapse" }}><tbody>
            {periodeLeft.map((r) => (
              <FR key={r.label} label={r.label}>
                {r.strong ? <span className="font-semibold">{r.value || "—"}</span> : (r.value || "—")}
              </FR>
            ))}
          </tbody></table>
          <table style={{ borderCollapse: "collapse" }}><tbody>
            {periodeRight.map((r) => (
              <FR key={r.label} label={r.label}>
                {r.strong ? <span className="font-semibold">{r.value || "—"}</span> : (r.value || "—")}
              </FR>
            ))}
          </tbody></table>
        </div>
      </Sec>

      {/* III. Diagnosa */}
      <Sec no="III" title="Diagnosa (ICD-10)">
        {diagnosa.length === 0 ? (
          <p className="text-[8.5pt] italic text-slate-400">Belum ada diagnosa terkode</p>
        ) : (
          <table style={{ borderCollapse: "collapse" }} className="w-full"><tbody>
            {diagnosaPrimer && (
              <FR label="Utama">
                <span className="font-bold">{diagnosaPrimer.namaDiagnosis}</span>{" "}
                <span className="font-mono text-[8pt] text-slate-500">[{diagnosaPrimer.kodeIcd10}]</span>
              </FR>
            )}
            {diagnosaLain.map(d => (
              <FR key={d.id} label={d.tipe}>
                {d.namaDiagnosis} <span className="font-mono text-[8pt] text-slate-500">[{d.kodeIcd10}]</span>
              </FR>
            ))}
          </tbody></table>
        )}
      </Sec>

      {/* IV. Tindakan */}
      {rm.tindakan.length > 0 && (
        <Sec no="IV" title="Tindakan / Prosedur (ICD-9-CM)">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-slate-200"><Th>Kode</Th><Th>Tindakan</Th><Th right>Tanggal</Th></tr></thead>
            <tbody>
              {rm.tindakan.map((t, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="w-16 py-0.5 font-mono text-[8pt] text-slate-600">{t.kodeIcd9}</td>
                  <td className="py-0.5 text-[8.5pt] text-slate-800">{t.namaTindakan}</td>
                  <td className="py-0.5 text-right text-[8pt] text-slate-500">{t.tanggal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sec>
      )}

      {/* V. TTV */}
      <Sec no="V" title={ttvTitle}>
        {rm.ttvMasuk ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Parameter</Th>
                <Th>{ttvColMasuk} ({rm.ttvMasuk.tanggal})</Th>
                <Th>{ttvColPulang} ({rm.ttvPulang?.tanggal ?? "—"})</Th>
              </tr>
            </thead>
            <tbody>
              {ttvRows.map(([param, masuk, pulang]) => (
                <tr key={param} className="border-b border-slate-100">
                  <td className="py-0.5 text-[8.5pt] text-slate-500">{param}</td>
                  <td className="py-0.5 text-[8.5pt] font-semibold text-slate-800">{masuk}</td>
                  <td className="py-0.5 text-[8.5pt] font-semibold text-slate-800">{pulang}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[8.5pt] italic text-slate-400">Data TTV belum tersedia</p>
        )}
      </Sec>

      {/* VI. Lab */}
      {rm.hasilLabAbnormal.length > 0 && (
        <Sec no="VI" title="Hasil Laboratorium Abnormal">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Pemeriksaan</Th><Th>Nilai</Th><Th>Satuan</Th><Th>Rujukan</Th><Th>Flag</Th><Th right>Tanggal</Th>
              </tr>
            </thead>
            <tbody>
              {rm.hasilLabAbnormal.map((l, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-0.5 text-[8.5pt] text-slate-800">{l.nama}</td>
                  <td className="py-0.5 text-[8.5pt] font-bold text-slate-900">{l.nilai}</td>
                  <td className="py-0.5 text-[8pt] text-slate-500">{l.satuan}</td>
                  <td className="py-0.5 text-[8pt] text-slate-500">{l.rujukan}</td>
                  <td className="py-0.5 text-[8pt] font-semibold text-slate-700">{FLAG_LABEL[l.flag] ?? l.flag}</td>
                  <td className="py-0.5 text-right text-[8pt] text-slate-500">{l.tanggal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sec>
      )}

      {/* VII. Rad */}
      {rm.hasilRad.length > 0 && (
        <Sec no="VII" title="Hasil Radiologi">
          <div className="space-y-1">
            {rm.hasilRad.map((r, i) => (
              <p key={i} className="text-[8.5pt] leading-relaxed text-slate-800">
                <span className="font-semibold">{r.jenis}</span>
                <span className="text-slate-500"> ({r.tanggal})</span>: {r.kesimpulan}
              </p>
            ))}
          </div>
        </Sec>
      )}

      {/* VIII. Obat */}
      {rm.obatSelamaRawat.length > 0 && (
        <Sec no="VIII" title={isRJ ? "Obat / Terapi" : "Obat Selama Perawatan"}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <Th>Nama Obat</Th><Th>Dosis</Th><Th>Rute</Th><Th>Mulai</Th><Th right>Selesai</Th>
              </tr>
            </thead>
            <tbody>
              {rm.obatSelamaRawat.map((o, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-0.5 text-[8.5pt] text-slate-800">
                    {o.namaObat}
                    {o.isHAM && <span className="ml-1 rounded bg-red-50 px-1 text-[7pt] font-bold text-red-700 ring-1 ring-red-200">HAM</span>}
                  </td>
                  <td className="py-0.5 text-[8pt] text-slate-600">{o.dosis}</td>
                  <td className="py-0.5 text-[8pt] text-slate-600">{o.rute}</td>
                  <td className="py-0.5 text-[8pt] text-slate-500">{o.mulaiTanggal}</td>
                  <td className="py-0.5 text-right text-[8pt] text-slate-500">{o.akhirTanggal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sec>
      )}

      {/* IX–XI. Narasi klinis */}
      {narasi.map(([no, title, content]) => (
        <Sec key={no} no={no} title={title}>
          <p className="whitespace-pre-wrap text-[8.5pt] leading-relaxed text-slate-800">{content || "—"}</p>
        </Sec>
      ))}

      {/* TTD + TTE */}
      <div className="page-break-avoid mt-6 flex items-end justify-between gap-6">
        <div className="text-[7.5pt] leading-relaxed text-slate-400">
          <p>Dokumen ini diterbitkan melalui EHIS dan sah tanpa tanda tangan basah</p>
          <p>sesuai UU ITE No. 11/2008 Pasal 11 tentang Tanda Tangan Elektronik.</p>
          <p className="mt-1">Pencatat: {rm.tteSignedBy || dpjp} · {rs.nama}</p>
        </div>

        <div className="shrink-0 text-center">
          <p className="text-[8.5pt] text-slate-600">
            {rs.alamat.kota}, {tte ? tte.signedAt : "________________"}
          </p>
          <p className="text-[8.5pt] font-bold text-slate-800">{dpjpLabel}</p>

          {tte ? (
            <div className="mt-1.5 inline-flex flex-col items-center rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-2.5">
              <TteQr value={qrPayload} size={84} />
              <p className="mt-1 font-mono text-[7.5pt] font-bold tracking-wider text-emerald-800">{tte.serial}</p>
              <p className="mt-0.5 text-[8.5pt] font-bold text-slate-800">{tte.signedBy}</p>
              <p className="text-[7pt] text-emerald-700">Ditandatangani secara elektronik · {tte.signedAt}</p>
            </div>
          ) : (
            <>
              <div className="mx-4 mt-14 border-b border-slate-800" />
              <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">{dpjp}</p>
              <p className="text-[7pt] italic text-slate-400">Belum ditandatangani elektronik</p>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-slate-200 pt-2 text-center text-[7pt] text-slate-400">
        {judul} · {pasien.noRM}{noKunjungan ? ` · ${noKunjungan}` : ""} &nbsp;·&nbsp; dicetak {new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} &nbsp;·&nbsp; {rs.nama}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ResumeMedikCetakModal({ open, onClose, model }: Props) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="no-print fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[3px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-3 z-50 flex flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl ring-1 ring-slate-200 md:inset-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-medik-print-title"
          >
            {/* Toolbar */}
            <header className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 text-sky-700 ring-1 ring-sky-200">
                  <Printer size={14} />
                </span>
                <div>
                  <h2 id="resume-medik-print-title" className="text-[13px] font-semibold text-slate-800">
                    Cetak Resume Medik
                  </h2>
                  <p className="flex items-center gap-1 text-[10.5px] text-slate-500">
                    Preview · A4 · {model.pasien.nama} · {model.pasien.noRM}
                    {model.tte && (
                      <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <ShieldCheck size={9} /> TTE {model.tte.serial}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimeout(() => window.print(), 60)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-[0.97]"
                  title="Cetak / simpan PDF"
                >
                  <Printer size={12} />
                  Cetak
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup"
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              </div>
            </header>

            {/* Preview area */}
            <div className="flex-1 overflow-auto bg-slate-200/60 px-3 py-5">
              <div className="print-area mx-auto w-[794px] max-w-full bg-white shadow-sm" data-paper="A4">
                <ResumeMedikTemplate model={model} />
              </div>
            </div>

            {/* Footer hint */}
            <footer className="no-print border-t border-slate-200 bg-white px-4 py-1.5 text-center text-[10px] text-slate-500">
              Tip: pada dialog cetak pilih &ldquo;Save as PDF&rdquo; untuk arsip digital ·
              <kbd className="ml-1 rounded border border-slate-300 bg-slate-100 px-1 font-mono text-[9.5px]">Esc</kbd> untuk tutup
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
