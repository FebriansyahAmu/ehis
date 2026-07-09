"use client";

// Surat Keterangan Sakit — form + daftar surat, SHARED (dipakai RJ Surat & Dokumen; reusable
// IGD/RI). Persist ke medicalrecord.SuratKeteranganSakit (nomor auto SKS-<YYMM><NNN>; tglSelesai
// di-hitung server). Panel Riwayat (samping) di-DRIVE dari DB via onListChange (bukan in-memory) —
// terisi dari fetch saat dibuka + sinkron create/hapus; tiap surat juga membawa data CETAK A4
// (SuratSakitCetakData) → tombol Cetak di panel kanan buka modal template resmi. Pasien demo
// (non-UUID) = daftar lokal. Diagnosis = rahasia medis → toggle "cantumkan diagnosis".

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileX2, Send, RotateCcw, Trash2, Info, EyeOff, Eye, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/shared/inputs/DatePicker";
import { Select } from "@/components/shared/inputs/Select";
import { tteSerial } from "@/components/shared/TteQr";
import {
  listSuratSakit, createSuratSakit, deleteSuratSakit, type SuratSakitDTO,
} from "@/lib/api/suratSakit/suratSakit";
import type { SuratSakitCetakData, SuratSakitTte } from "./SuratKeteranganSakitTemplate";
import { type SuratPatient, type SuratDibuat, genSuratId, genNomorSurat } from "../suratDokumen/suratDokumenShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const KEPERLUAN_OPTS = ["Istirahat Bekerja", "Istirahat Sekolah", "Pemulihan di Rumah", "Lainnya"];

/** Satu surat sakit → kartu riwayat (SuratDibuat) + data cetak A4 (SuratSakitCetakData). */
export interface SakitSuratEntry {
  surat: SuratDibuat;
  cetak: SuratSakitCetakData;
}

interface SuratSakitLocal {
  id: string;
  tglPeriksa: string;
  tglMulai: string;
  tglSelesai: string;
  lamaHari: number;
  keperluan: string;
  diagnosa: string;
  cantumkanDiagnosa: boolean;
  pekerjaan: string;
  instansi: string;
  catatan: string;
}

// ── Helpers ───────────────────────────────────────────────

function fmtTgl(ymd?: string): string {
  if (!ymd) return "—";
  const d = new Date(/^\d{4}-\d{2}-\d{2}/.test(ymd) ? `${ymd.slice(0, 10)}T00:00:00` : ymd);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/** ISO → "8 Juli 2026, 14.30" (display TTE). */
function fmtSignedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** tglMulai + (lama-1) hari → "YYYY-MM-DD" (mirror hitungan server; timezone-safe UTC). */
function addRestDays(tglMulai: string, lamaHari: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tglMulai) || lamaHari < 1) return "";
  const [y, m, d] = tglMulai.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d) + (lamaHari - 1) * 86400000);
  return `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`;
}

function buildPasien(patient: SuratPatient): SuratSakitCetakData["pasien"] {
  return {
    nama: patient.name,
    noRM: patient.noRM,
    gender: patient.gender,
    umur: `${patient.age} tahun`,
    tanggalLahir: patient.tanggalLahir || undefined,
  };
}

// Field id data selaras SURAT_CONFIG "ket-sakit" agar label detail terbaca di kartu riwayat.
function suratData(s: {
  tglMulai: string; tglSelesai: string; lamaHari: number; keperluan: string;
  diagnosa: string; cantumkanDiagnosa: boolean; pekerjaan: string; instansi: string; catatan: string;
}): Record<string, string> {
  return {
    mulai: fmtTgl(s.tglMulai),
    selesai: fmtTgl(s.tglSelesai),
    lama: `${s.lamaHari} hari`,
    ...(s.keperluan ? { keperluan: s.keperluan } : {}),
    ...(s.diagnosa ? { diagnosa: s.cantumkanDiagnosa ? s.diagnosa : `${s.diagnosa} (tidak dicetak — rahasia medis)` } : {}),
    ...(s.pekerjaan ? { pekerjaan: s.pekerjaan } : {}),
    ...(s.instansi ? { instansi: s.instansi } : {}),
    ...(s.catatan ? { catatan: s.catatan } : {}),
  };
}

function dtoToSurat(dto: SuratSakitDTO): SuratDibuat {
  return {
    id: dto.id,
    jenis: "ket-sakit",
    nomorSurat: dto.nomor || "—",
    tanggalBuat: dto.createdAt.slice(0, 10),
    data: suratData(dto),
    dokterPembuat: dto.dokterNama || dto.pencatat,
  };
}

function dtoToCetak(dto: SuratSakitDTO, pasien: SuratSakitCetakData["pasien"], dokter: string): SuratSakitCetakData {
  const tte: SuratSakitTte | null = dto.tteToken
    ? {
        serial: dto.tteToken,
        signedBy: dto.tteSignedBy || dto.dokterNama || dokter,
        signedAt: dto.tteSignedAt ? fmtSignedAt(dto.tteSignedAt) : "",
      }
    : null;
  return {
    surat: {
      nomor: dto.nomor, tglPeriksa: dto.tglPeriksa, tglMulai: dto.tglMulai, tglSelesai: dto.tglSelesai,
      lamaHari: dto.lamaHari, keperluan: dto.keperluan || undefined, diagnosa: dto.diagnosa || undefined,
      cantumkanDiagnosa: dto.cantumkanDiagnosa, pekerjaan: dto.pekerjaan || undefined,
      instansi: dto.instansi || undefined, catatan: dto.catatan || undefined,
      pencatat: dto.pencatat || undefined, terbitAt: dto.createdAt,
    },
    pasien,
    dokter: dto.dokterNama || dokter,
    tte,
  };
}

function localToSurat(l: SuratSakitLocal, dokter: string): SuratDibuat {
  return {
    id: l.id,
    jenis: "ket-sakit",
    nomorSurat: genNomorSurat("ket-sakit"),
    tanggalBuat: new Date().toISOString().slice(0, 10),
    data: suratData(l),
    dokterPembuat: dokter,
  };
}

/** Bangun entri (kartu + cetak) dari DTO server — dipakai induk untuk PRAMUAT Riwayat Surat
 *  saat tab dibuka (tanpa menunggu pane dibuka). Sumber tunggal pemetaan (dipakai mirror pane juga). */
export function sakitEntriesFromDtos(dtos: SuratSakitDTO[], patient: SuratPatient): SakitSuratEntry[] {
  const pasien = buildPasien(patient);
  return dtos.map((dto) => ({ surat: dtoToSurat(dto), cetak: dtoToCetak(dto, pasien, patient.dokter) }));
}

function localToCetak(l: SuratSakitLocal, pasien: SuratSakitCetakData["pasien"], dokter: string): SuratSakitCetakData {
  // Demo (non-UUID): TTE derivatif deterministik agar cetak tetap menampilkan QR (pola ResumeMedik demo).
  const tte: SuratSakitTte = {
    serial: tteSerial(`${pasien.noRM}|${l.tglMulai}|${l.lamaHari}`, "TTE-SKS"),
    signedBy: dokter,
    signedAt: fmtSignedAt(new Date().toISOString()),
  };
  return {
    surat: {
      nomor: "", tglPeriksa: l.tglPeriksa, tglMulai: l.tglMulai, tglSelesai: l.tglSelesai,
      lamaHari: l.lamaHari, keperluan: l.keperluan || undefined, diagnosa: l.diagnosa || undefined,
      cantumkanDiagnosa: l.cantumkanDiagnosa, pekerjaan: l.pekerjaan || undefined,
      instansi: l.instansi || undefined, catatan: l.catatan || undefined,
    },
    pasien,
    dokter,
    tte,
  };
}

// ── Field wrapper ─────────────────────────────────────────

function Field({ label, required, children, className }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}{required && <span className="ml-1 text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-400";

// ── Main ──────────────────────────────────────────────────

export default function SuratSakitPane({
  patient, onListChange,
}: {
  patient: SuratPatient;
  /** Mirror daftar surat sakit (kartu + data cetak) ke induk. Harus stabil (mis. setState). */
  onListChange?: (entries: SakitSuratEntry[]) => void;
}) {
  const kunjunganId = patient.kunjunganId ?? "";
  const isPersisted = UUID_RE.test(kunjunganId);

  const [serverItems, setServerItems] = useState<SuratSakitDTO[]>([]);
  const [localItems, setLocalItems] = useState<SuratSakitLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Form state ──
  const today = new Date().toISOString().slice(0, 10);
  const tglKunjungan = patient.tanggalKunjungan?.slice(0, 10) || today;
  const [tglPeriksa, setTglPeriksa] = useState(tglKunjungan);
  const [tglMulai, setTglMulai] = useState(tglKunjungan);
  const [lamaHari, setLamaHari] = useState(1);
  const [keperluan, setKeperluan] = useState(KEPERLUAN_OPTS[0]);
  const [diagnosa, setDiagnosa] = useState(patient.diagnosa ?? "");
  const [cantumkanDiagnosa, setCantumkanDiagnosa] = useState(false);
  const [pekerjaan, setPekerjaan] = useState("");
  const [instansi, setInstansi] = useState("");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tglSelesai = useMemo(() => addRestDays(tglMulai, lamaHari), [tglMulai, lamaHari]);

  // ── Fetch (persisted) ──
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    setLoading(true);
    listSuratSakit(kunjunganId, ac.signal)
      .then((rows) => { if (!ac.signal.aborted) setServerItems(rows); })
      .catch(() => { if (!ac.signal.aborted) setError("Gagal memuat daftar surat."); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  // ── Mirror ke induk (side panel + cetak) ──
  useEffect(() => {
    if (!onListChange) return;
    const pasien = buildPasien(patient);
    const entries: SakitSuratEntry[] = isPersisted
      ? sakitEntriesFromDtos(serverItems, patient)
      : localItems.map((l) => ({ surat: localToSurat(l, patient.dokter), cetak: localToCetak(l, pasien, patient.dokter) }));
    onListChange(entries);
  }, [isPersisted, serverItems, localItems, patient, onListChange]);

  const jumlah = isPersisted ? serverItems.length : localItems.length;
  const isValid = /^\d{4}-\d{2}-\d{2}$/.test(tglMulai) && /^\d{4}-\d{2}-\d{2}$/.test(tglPeriksa) && lamaHari >= 1;

  function resetForm() {
    setTglPeriksa(tglKunjungan);
    setTglMulai(tglKunjungan);
    setLamaHari(1);
    setKeperluan(KEPERLUAN_OPTS[0]);
    setDiagnosa(patient.diagnosa ?? "");
    setCantumkanDiagnosa(false);
    setPekerjaan("");
    setInstansi("");
    setCatatan("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setError(null);
    setSubmitting(true);
    const payload = {
      tglPeriksa, tglMulai, lamaHari, keperluan, diagnosa: diagnosa.trim(),
      cantumkanDiagnosa, pekerjaan: pekerjaan.trim(), instansi: instansi.trim(),
      catatan: catatan.trim(), dokterNama: patient.dokter,
    };
    try {
      if (isPersisted) {
        const dto = await createSuratSakit(kunjunganId, payload);
        setServerItems((prev) => [dto, ...prev]);
      } else {
        setLocalItems((prev) => [{
          id: genSuratId(), tglPeriksa, tglMulai, tglSelesai, lamaHari, keperluan,
          diagnosa: diagnosa.trim(), cantumkanDiagnosa, pekerjaan: pekerjaan.trim(),
          instansi: instansi.trim(), catatan: catatan.trim(),
        }, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menerbitkan surat.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleDelete = useCallback(async (id: string) => {
    setError(null);
    if (isPersisted) {
      setBusyId(id);
      try {
        await deleteSuratSakit(kunjunganId, id);
        setServerItems((prev) => prev.filter((x) => x.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membatalkan surat.");
      } finally {
        setBusyId(null);
      }
    } else {
      setLocalItems((prev) => prev.filter((x) => x.id !== id));
    }
  }, [isPersisted, kunjunganId]);

  const cards = isPersisted
    ? serverItems.map((d) => ({
        id: d.id, nomor: d.nomor, tglMulai: d.tglMulai, tglSelesai: d.tglSelesai,
        lamaHari: d.lamaHari, keperluan: d.keperluan, tte: !!d.tteToken,
      }))
    : localItems.map((l) => ({
        id: l.id, nomor: "(lokal)", tglMulai: l.tglMulai, tglSelesai: l.tglSelesai,
        lamaHari: l.lamaHari, keperluan: l.keperluan, tte: true,
      }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <FileX2 size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-700">Surat Keterangan Sakit</p>
            <p className="mt-0.5 text-xs text-slate-400">Keterangan istirahat / tidak dapat bekerja · PMK 269/2008</p>
          </div>
        </div>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-bold",
          jumlah > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-400",
        )}>
          {jumlah} surat
        </span>
      </div>

      {/* Info strip */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] text-slate-500">
        <span><span className="font-semibold text-slate-700">Pasien</span> {patient.name}</span>
        <span><span className="font-semibold text-slate-700">No. RM</span> {patient.noRM}</span>
        <span><span className="font-semibold text-slate-700">Dokter</span> {patient.dokter}</span>
        {!isPersisted && (
          <span className="text-amber-600">Pasien demo — surat tersimpan lokal (tidak dikirim ke server).</span>
        )}
        {isPersisted && (
          <span className="text-slate-400">Nomor surat auto sistem · TTE dokter otomatis saat diterbitkan · cetak resmi dari panel Riwayat.</span>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal Pemeriksaan" required>
            <DatePicker value={tglPeriksa} onChange={setTglPeriksa} clearable={false} />
          </Field>
          <Field label="Tanggal Mulai Istirahat" required>
            <DatePicker value={tglMulai} onChange={setTglMulai} clearable={false} />
          </Field>

          <Field label="Lama Istirahat (hari)" required>
            <input
              type="number" min={1} max={365} value={lamaHari}
              onChange={(e) => setLamaHari(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
              className={inputCls}
            />
          </Field>
          <Field label="Sampai Dengan (otomatis)">
            <div className="flex h-9.5 items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
              {tglSelesai ? fmtTgl(tglSelesai) : "—"}
            </div>
          </Field>

          <Field label="Keperluan">
            <Select value={keperluan} onChange={setKeperluan} options={KEPERLUAN_OPTS} />
          </Field>
          <Field label="Ditujukan Kepada (instansi/sekolah)">
            <input
              type="text" value={instansi} onChange={(e) => setInstansi(e.target.value)}
              placeholder="Opsional — mis. HRD PT. …" className={inputCls}
            />
          </Field>

          <Field label="Pekerjaan Pasien">
            <input
              type="text" value={pekerjaan} onChange={(e) => setPekerjaan(e.target.value)}
              placeholder="Opsional" className={inputCls}
            />
          </Field>
          <Field label="Diagnosa">
            <input
              type="text" value={diagnosa} onChange={(e) => setDiagnosa(e.target.value)}
              placeholder="Diagnosa utama (opsional)" className={inputCls}
            />
          </Field>

          {/* Toggle cantumkan diagnosis — rahasia medis */}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setCantumkanDiagnosa((v) => !v)}
              disabled={!diagnosa.trim()}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left transition",
                cantumkanDiagnosa
                  ? "border-rose-300 bg-rose-50"
                  : "border-slate-200 bg-white hover:border-slate-300",
                !diagnosa.trim() && "cursor-not-allowed opacity-50",
              )}
            >
              <span className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                cantumkanDiagnosa ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-400",
              )}>
                {cantumkanDiagnosa ? <Eye size={15} /> : <EyeOff size={15} />}
              </span>
              <span className="flex-1">
                <span className="block text-xs font-semibold text-slate-700">
                  {cantumkanDiagnosa ? "Diagnosis DICANTUMKAN pada surat" : "Diagnosis disembunyikan (default)"}
                </span>
                <span className="block text-[11px] leading-snug text-slate-400">
                  Diagnosis adalah rahasia medis (UU 29/2004) — cantumkan hanya atas persetujuan pasien / kebutuhan sah.
                </span>
              </span>
              <span className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition",
                cantumkanDiagnosa ? "bg-rose-500" : "bg-slate-200",
              )}>
                <span className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
                  cantumkanDiagnosa ? "left-4.5" : "left-0.5",
                )} />
              </span>
            </button>
          </div>

          <Field label="Keterangan Tambahan" className="sm:col-span-2">
            <textarea
              rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan tambahan (opsional)"
              className={cn(inputCls, "resize-none")}
            />
          </Field>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] text-rose-700">
            <Info size={13} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button" onClick={resetForm}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          >
            <RotateCcw size={11} /> Reset
          </button>
          <button
            type="submit"
            disabled={!isValid || submitting}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition",
              isValid && !submitting ? "bg-rose-600 hover:bg-rose-700" : "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none",
            )}
          >
            {submitting ? <><Loader2 size={12} className="animate-spin" /> Menerbitkan…</> : <><Send size={11} /> Terbitkan Surat</>}
          </button>
        </div>
      </form>

      {/* Daftar surat aktif */}
      <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3">
        <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Surat Diterbitkan {loading && <Loader2 size={10} className="ml-1 inline animate-spin" />}
        </p>
        {cards.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-400">Belum ada surat diterbitkan.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {cards.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                  <FileX2 size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-xs font-semibold text-slate-800">
                    <span className="font-mono">{c.nomor}</span>
                    <span className="font-bold text-rose-600">{c.lamaHari} hari</span>
                    {c.tte && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                        <ShieldCheck size={9} /> TTE
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {fmtTgl(c.tglMulai)} — {fmtTgl(c.tglSelesai)}{c.keperluan && <> · {c.keperluan}</>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={busyId === c.id}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                >
                  {busyId === c.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                  Batalkan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
