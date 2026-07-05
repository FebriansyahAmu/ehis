"use client";

// Resume Pulang Cetak — modal preview + template A4 (KOP RS) + blok TTE QR DPJP.
// Salinan discharge summary untuk PASIEN (PMK 24/2022). Modal pola ResepCetakModal/
// ResumeMedikCetak (infra print global `.print-area`/`.no-print`). QR TTE deterministik
// dari payload EHIS-RESPUL (shared TteQr); serial dari server (ResumePulang.tteToken).

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, ShieldCheck } from "lucide-react";
import type { RawatInapPatientDetail, IGDDiagnosa } from "@/lib/data";
import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import TteQr from "@/components/shared/TteQr";
import type { PasienPulangData } from "./pasienPulangShared";

export interface ResumePulangTte {
  serial: string;
  signedBy: string;
  signedAt: string; // display
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: PasienPulangData;
  patient: RawatInapPatientDetail;
  diagnosa: IGDDiagnosa[];
  tte: ResumePulangTte | null;
}

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

// ── Template A4 ───────────────────────────────────────────────────────────────

function ResumePulangTemplate({ data, patient, diagnosa, tte }: Omit<Props, "open" | "onClose">) {
  const rs = RS_PROFIL_INITIAL;
  const rp = data.resumePulang;
  const diagnosaPrimer = diagnosa.find((d) => d.tipe === "Utama");
  const diagnosaLain   = diagnosa.filter((d) => d.tipe !== "Utama");

  const tglKrs = data.tanggalPulang
    ? new Date(data.tanggalPulang).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const lamaRawat = (() => {
    if (!data.tanggalPulang || !patient.admitDate) return "—";
    const ms = new Date(data.tanggalPulang).getTime() - new Date(patient.admitDate).getTime();
    return `${Math.max(1, Math.ceil(ms / 86400000))} hari`;
  })();

  const qrPayload = tte
    ? `EHIS-RESPUL|${patient.noKunjungan}|${patient.noRM}|${tte.signedBy}|${tte.signedAt}|${tte.serial}`
    : "";

  const narasi: Array<[string, string, string]> = [
    ["IV", "Anamnesis Singkat & Pemeriksaan Fisik", rp.ringkasanAnamnesis],
    ["V", "Hasil Penunjang Bermakna", rp.hasilPemeriksaan],
    ["VI", "Terapi yang Diberikan", rp.terapiDiberikan],
    ["VII", "Kondisi Saat Pulang", rp.kondisiSaatPulang],
    ["VIII", "Instruksi & Anjuran Pulang", rp.instruksiPulang],
    ["IX", "Pembatasan Aktivitas", rp.pembatasanAktivitas],
    ["X", "Diet di Rumah", rp.dietPulang],
  ];

  return (
    <div className="flex min-h-full w-full flex-col bg-white px-11 py-8 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      {/* Judul */}
      <div className="mt-3 text-center">
        <h2 className="text-[12.5pt] font-bold uppercase tracking-[0.25em] text-slate-900 underline decoration-2 underline-offset-4">
          Resume Pulang
        </h2>
        <p className="mt-0.5 text-[7.5pt] text-slate-500">Salinan untuk Pasien · PMK 24/2022</p>
      </div>

      {/* I. Identitas */}
      <Sec no="I" title="Identitas Pasien">
        <div className="grid grid-cols-2 gap-x-8">
          <table style={{ borderCollapse: "collapse" }}><tbody>
            <FR label="Nama Pasien"><span className="font-bold">{patient.name}</span></FR>
            <FR label="No. Rekam Medis"><span className="font-mono font-semibold">{patient.noRM}</span></FR>
            <FR label="Umur / JK">{patient.age} tahun / {patient.gender === "L" ? "Laki-laki" : "Perempuan"}</FR>
          </tbody></table>
          <table style={{ borderCollapse: "collapse" }}><tbody>
            <FR label="Penjamin">{patient.penjamin.replace(/_/g, " ")}{patient.noBpjs ? ` · ${patient.noBpjs}` : ""}</FR>
            <FR label="Tanggal Lahir">{patient.tanggalLahir || "—"}</FR>
            <FR label="Alamat">{patient.alamat || "—"}</FR>
          </tbody></table>
        </div>
      </Sec>

      {/* II. Periode */}
      <Sec no="II" title="Periode Perawatan">
        <div className="grid grid-cols-2 gap-x-8">
          <table style={{ borderCollapse: "collapse" }}><tbody>
            <FR label="Tanggal Masuk">{patient.tglMasuk}</FR>
            <FR label="Tanggal Pulang">{tglKrs}</FR>
            <FR label="Lama Rawat (LOS)">{lamaRawat}</FR>
          </tbody></table>
          <table style={{ borderCollapse: "collapse" }}><tbody>
            <FR label="Ruangan / Kelas">{patient.ruangan} / {patient.kelas.replace(/_/g, " ")}</FR>
            <FR label="DPJP">{patient.dpjp}</FR>
            <FR label="Status Pulang"><span className="font-semibold">{data.status || "—"}</span></FR>
          </tbody></table>
        </div>
      </Sec>

      {/* III. Diagnosa */}
      <Sec no="III" title="Diagnosa">
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
            {diagnosaLain.map((d) => (
              <FR key={d.id} label={d.tipe}>
                {d.namaDiagnosis} <span className="font-mono text-[8pt] text-slate-500">[{d.kodeIcd10}]</span>
              </FR>
            ))}
          </tbody></table>
        )}
      </Sec>

      {/* IV–X. Narasi */}
      {narasi.map(([no, title, content]) => (
        <Sec key={no} no={no} title={title}>
          <p className="whitespace-pre-wrap text-[8.5pt] leading-relaxed text-slate-800">{content || "—"}</p>
        </Sec>
      ))}

      {/* XI. Obat pulang */}
      <Sec no="XI" title="Obat yang Dibawa Pulang">
        {data.obatPulang.length === 0 ? (
          <p className="text-[8.5pt] italic text-slate-400">—</p>
        ) : (
          <ol className="list-decimal space-y-0.5 pl-5 text-[8.5pt] text-slate-800">
            {data.obatPulang.map((ob) => (
              <li key={ob.id}>
                {ob.namaObat}{ob.dosis ? ` ${ob.dosis}` : ""}{ob.frekuensi ? ` — ${ob.frekuensi}` : ""}{ob.durasi ? `, selama ${ob.durasi}` : ""}
                {ob.isHAM && <span className="ml-1 rounded bg-red-50 px-1 text-[7pt] font-bold text-red-700 ring-1 ring-red-200">HAM</span>}
              </li>
            ))}
          </ol>
        )}
      </Sec>

      {/* XII. Rencana kontrol */}
      <Sec no="XII" title="Rencana Kontrol / Follow-up">
        {data.jadwalKontrol.length === 0 ? (
          <p className="text-[8.5pt] italic text-slate-400">—</p>
        ) : (
          <ul className="space-y-0.5 text-[8.5pt] text-slate-800">
            {data.jadwalKontrol.map((jk) => (
              <li key={jk.id}>
                • {new Date(jk.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                {" — "}{jk.poli}{jk.dokter ? ` (${jk.dokter})` : ""}
              </li>
            ))}
          </ul>
        )}
      </Sec>

      {/* TTD pasien + DPJP (QR) */}
      <div className="page-break-avoid mt-6 grid grid-cols-2 gap-8">
        <div className="text-center">
          <p className="text-[8.5pt] text-slate-600">Yang Menerima,</p>
          <p className="text-[8.5pt] font-bold text-slate-800">Pasien / Wali</p>
          <div className="mx-6 mt-14 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">{patient.name}</p>
        </div>
        <div className="text-center">
          <p className="text-[8.5pt] text-slate-600">{rs.alamat.kota}, {tte ? tte.signedAt : "________________"}</p>
          <p className="text-[8.5pt] font-bold text-slate-800">Dokter Penanggung Jawab (DPJP)</p>
          {tte ? (
            <div className="mt-1.5 inline-flex flex-col items-center rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-2.5">
              <TteQr value={qrPayload} size={82} />
              <p className="mt-1 font-mono text-[7.5pt] font-bold tracking-wider text-emerald-800">{tte.serial}</p>
              <p className="mt-0.5 text-[8.5pt] font-bold text-slate-800">{tte.signedBy}</p>
              <p className="text-[7pt] text-emerald-700">Ditandatangani elektronik · {tte.signedAt}</p>
            </div>
          ) : (
            <>
              <div className="mx-6 mt-14 border-b border-slate-800" />
              <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">{patient.dpjp}</p>
              <p className="text-[7pt] italic text-slate-400">Belum ditandatangani elektronik</p>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-slate-200 pt-2 text-center text-[7pt] text-slate-400">
        Resume Pulang · {patient.noRM} · {patient.noKunjungan} &nbsp;·&nbsp; dicetak {new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} &nbsp;·&nbsp; {rs.nama}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ResumePulangCetakModal({ open, onClose, data, patient, diagnosa, tte }: Props) {
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
            aria-labelledby="resume-pulang-print-title"
          >
            {/* Toolbar */}
            <header className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 text-orange-700 ring-1 ring-orange-200">
                  <Printer size={14} />
                </span>
                <div>
                  <h2 id="resume-pulang-print-title" className="text-[13px] font-semibold text-slate-800">
                    Cetak Resume Pulang
                  </h2>
                  <p className="flex items-center gap-1 text-[10.5px] text-slate-500">
                    Preview · A4 · {patient.name} · {patient.noRM}
                    {tte && (
                      <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <ShieldCheck size={9} /> TTE {tte.serial}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimeout(() => window.print(), 60)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.97]"
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
                <ResumePulangTemplate data={data} patient={patient} diagnosa={diagnosa} tte={tte} />
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
