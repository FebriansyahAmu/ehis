"use client";

// Surat Keterangan Sehat / Berbadan Sehat — form + daftar surat, SHARED (dipakai RJ Surat &
// Dokumen; reusable IGD/RI). Persist ke medicalrecord.SuratKeteranganSehat (nomor auto SKH-<YYMM>
// <NNN>; TTE Dokter Pemeriksa auto saat terbit bila actor Dokter). Panel Riwayat (samping) di-DRIVE
// dari DB via onListChange (bukan in-memory) — terisi dari fetch saat dibuka + sinkron create/hapus;
// tiap surat membawa data CETAK A4 (SuratSehatCetakData) → tombol Cetak buka modal template resmi.
// Pasien demo (non-UUID) = daftar lokal (TTE derivatif deterministik agar QR cetak tetap tampil).

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Send, RotateCcw, Trash2, Info, Loader2, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/shared/inputs/DatePicker";
import { Select } from "@/components/shared/inputs/Select";
import { tteSerial } from "@/components/shared/TteQr";
import {
  listSuratSehat, createSuratSehat, deleteSuratSehat, type SuratSehatDTO, type SuratSehatInput,
} from "@/lib/api/suratSehat/suratSehat";
import type { SuratSehatCetakData, SuratSehatTte } from "./SuratKeteranganSehatTemplate";
import { type SuratPatient, type SuratDibuat, genSuratId, genNomorSurat } from "../suratDokumen/suratDokumenShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const KESIMPULAN_OPTS = ["Sehat", "Sehat dengan Catatan", "Tidak Sehat"];
const KEPERLUAN_OPTS = [
  "Melamar Pekerjaan", "Keperluan Sekolah / Kuliah", "Keperluan Administrasi",
  "Pembuatan SIM / SKCK", "Keperluan Olahraga", "Lainnya",
];
const GOLDAR_OPTS = ["Tidak Diketahui", "O", "A", "B", "AB", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const PENGLIHATAN_OPTS = ["Normal", "Rabun (berkacamata)", "Gangguan penglihatan"];
const BUTAWARNA_OPTS = ["Normal", "Buta warna parsial", "Buta warna total"];
const PENDENGARAN_OPTS = ["Normal", "Terganggu"];

/** Satu surat sehat → kartu riwayat (SuratDibuat) + data cetak A4 (SuratSehatCetakData). */
export interface SehatSuratEntry {
  surat: SuratDibuat;
  cetak: SuratSehatCetakData;
}

interface SuratSehatLocal {
  id: string;
  tglPeriksa: string;
  tinggiBadan: number | null;
  beratBadan: number | null;
  tekananDarah: string;
  nadi: number | null;
  golonganDarah: string;
  penglihatan: string;
  butaWarna: string;
  pendengaran: string;
  riwayatPenyakit: string;
  kesimpulan: string;
  keperluan: string;
  instansi: string;
  berlakuHingga: string;
  catatan: string;
  pekerjaan: string;
}

// ── Helpers ───────────────────────────────────────────────

function fmtTgl(ymd?: string): string {
  if (!ymd) return "";
  const d = new Date(/^\d{4}-\d{2}-\d{2}/.test(ymd) ? `${ymd.slice(0, 10)}T00:00:00` : ymd);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function fmtSignedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toIntOrNull(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Math.round(Number(t));
  return Number.isFinite(n) ? n : null;
}

function bmiOf(tinggi: number | null, berat: number | null): number | null {
  return tinggi && berat && tinggi > 0 ? berat / (tinggi / 100) ** 2 : null;
}

/** Ringkasan pemeriksaan untuk kartu Riwayat (label detail). */
function pemeriksaanSummary(s: SuratSehatShape): string {
  const parts: string[] = [];
  if (s.tinggiBadan != null) parts.push(`TB ${s.tinggiBadan} cm`);
  if (s.beratBadan != null) parts.push(`BB ${s.beratBadan} kg`);
  if (s.tekananDarah.trim()) parts.push(`TD ${s.tekananDarah}`);
  if (s.nadi != null) parts.push(`Nadi ${s.nadi}`);
  if (s.golonganDarah.trim() && s.golonganDarah !== "Tidak Diketahui") parts.push(`Gol. ${s.golonganDarah}`);
  if (s.butaWarna.trim()) parts.push(`Buta Warna: ${s.butaWarna}`);
  return parts.join(" · ");
}

interface SuratSehatShape {
  tinggiBadan: number | null; beratBadan: number | null; tekananDarah: string; nadi: number | null;
  golonganDarah: string; penglihatan: string; butaWarna: string; pendengaran: string;
  riwayatPenyakit: string; kesimpulan: string; keperluan: string; instansi: string;
  berlakuHingga: string; catatan: string;
}

function suratData(s: SuratSehatShape): Record<string, string> {
  const pem = pemeriksaanSummary(s);
  return {
    kesimpulan: s.kesimpulan || "Sehat",
    ...(pem ? { pemeriksaan: pem } : {}),
    ...(s.keperluan ? { keperluan: s.keperluan } : {}),
    ...(s.instansi ? { instansi: s.instansi } : {}),
    ...(s.berlakuHingga ? { berlaku: fmtTgl(s.berlakuHingga) } : {}),
    ...(s.catatan ? { catatan: s.catatan } : {}),
  };
}

function buildPasien(patient: SuratPatient): SuratSehatCetakData["pasien"] {
  return {
    nama: patient.name, noRM: patient.noRM, gender: patient.gender,
    umur: `${patient.age} tahun`, tanggalLahir: patient.tanggalLahir || undefined,
  };
}

function cetakSurat(s: SuratSehatShape & { nomor: string; tglPeriksa: string; pekerjaan: string; pencatat?: string; terbitAt?: string }): SuratSehatCetakData["surat"] {
  return {
    nomor: s.nomor, tglPeriksa: s.tglPeriksa,
    tinggiBadan: s.tinggiBadan, beratBadan: s.beratBadan, tekananDarah: s.tekananDarah, nadi: s.nadi,
    golonganDarah: s.golonganDarah, penglihatan: s.penglihatan, butaWarna: s.butaWarna,
    pendengaran: s.pendengaran, riwayatPenyakit: s.riwayatPenyakit, kesimpulan: s.kesimpulan,
    keperluan: s.keperluan || undefined, instansi: s.instansi || undefined,
    berlakuHingga: s.berlakuHingga || undefined, catatan: s.catatan || undefined,
    pekerjaan: s.pekerjaan || undefined, pencatat: s.pencatat, terbitAt: s.terbitAt,
  };
}

function dtoToSurat(dto: SuratSehatDTO): SuratDibuat {
  return {
    id: dto.id, jenis: "ket-sehat", nomorSurat: dto.nomor || "—",
    tanggalBuat: dto.createdAt.slice(0, 10), data: suratData(dto),
    dokterPembuat: dto.dokterNama || dto.pencatat,
  };
}

function dtoToCetak(dto: SuratSehatDTO, pasien: SuratSehatCetakData["pasien"], dokter: string): SuratSehatCetakData {
  const tte: SuratSehatTte | null = dto.tteToken
    ? { serial: dto.tteToken, signedBy: dto.tteSignedBy || dto.dokterNama || dokter, signedAt: dto.tteSignedAt ? fmtSignedAt(dto.tteSignedAt) : "" }
    : null;
  return {
    surat: cetakSurat({ ...dto, pekerjaan: dto.pekerjaan, pencatat: dto.pencatat || undefined, terbitAt: dto.createdAt }),
    pasien, dokter: dto.dokterNama || dokter, tte,
  };
}

/** Bangun entri (kartu + cetak) dari DTO server — dipakai induk untuk PRAMUAT Riwayat Surat
 *  saat tab dibuka (tanpa menunggu pane dibuka). Sumber tunggal pemetaan (dipakai mirror pane juga). */
export function sehatEntriesFromDtos(dtos: SuratSehatDTO[], patient: SuratPatient): SehatSuratEntry[] {
  const pasien = buildPasien(patient);
  return dtos.map((dto) => ({ surat: dtoToSurat(dto), cetak: dtoToCetak(dto, pasien, patient.dokter) }));
}

function localToSurat(l: SuratSehatLocal, dokter: string): SuratDibuat {
  return {
    id: l.id, jenis: "ket-sehat", nomorSurat: genNomorSurat("ket-sehat"),
    tanggalBuat: new Date().toISOString().slice(0, 10), data: suratData(l), dokterPembuat: dokter,
  };
}

function localToCetak(l: SuratSehatLocal, pasien: SuratSehatCetakData["pasien"], dokter: string): SuratSehatCetakData {
  const tte: SuratSehatTte = {
    serial: tteSerial(`${pasien.noRM}|${l.tglPeriksa}|${l.kesimpulan}`, "TTE-SKH"),
    signedBy: dokter, signedAt: fmtSignedAt(new Date().toISOString()),
  };
  return { surat: cetakSurat({ ...l, nomor: "" }), pasien, dokter, tte };
}

// ── Field wrappers ────────────────────────────────────────

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
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400";

// ── Main ──────────────────────────────────────────────────

export default function SuratSehatPane({
  patient, onListChange,
}: {
  patient: SuratPatient;
  onListChange?: (entries: SehatSuratEntry[]) => void;
}) {
  const kunjunganId = patient.kunjunganId ?? "";
  const isPersisted = UUID_RE.test(kunjunganId);

  const [serverItems, setServerItems] = useState<SuratSehatDTO[]>([]);
  const [localItems, setLocalItems] = useState<SuratSehatLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Form state ──
  const today = new Date().toISOString().slice(0, 10);
  const tglKunjungan = patient.tanggalKunjungan?.slice(0, 10) || today;
  const [tglPeriksa, setTglPeriksa] = useState(tglKunjungan);
  const [tinggi, setTinggi] = useState("");
  const [berat, setBerat] = useState("");
  const [tekananDarah, setTekananDarah] = useState("");
  const [nadi, setNadi] = useState("");
  const [golonganDarah, setGolonganDarah] = useState("Tidak Diketahui");
  const [penglihatan, setPenglihatan] = useState("Normal");
  const [butaWarna, setButaWarna] = useState("Normal");
  const [pendengaran, setPendengaran] = useState("Normal");
  const [riwayatPenyakit, setRiwayatPenyakit] = useState("");
  const [kesimpulan, setKesimpulan] = useState(KESIMPULAN_OPTS[0]);
  const [keperluan, setKeperluan] = useState(KEPERLUAN_OPTS[0]);
  const [instansi, setInstansi] = useState("");
  const [berlakuHingga, setBerlakuHingga] = useState("");
  const [pekerjaan, setPekerjaan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const bmi = useMemo(() => bmiOf(toIntOrNull(tinggi), toIntOrNull(berat)), [tinggi, berat]);

  // ── Fetch (persisted) ──
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    setLoading(true);
    listSuratSehat(kunjunganId, ac.signal)
      .then((rows) => { if (!ac.signal.aborted) setServerItems(rows); })
      .catch(() => { if (!ac.signal.aborted) setError("Gagal memuat daftar surat."); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  // ── Mirror ke induk (side panel + cetak) ──
  useEffect(() => {
    if (!onListChange) return;
    const pasien = buildPasien(patient);
    const entries: SehatSuratEntry[] = isPersisted
      ? sehatEntriesFromDtos(serverItems, patient)
      : localItems.map((l) => ({ surat: localToSurat(l, patient.dokter), cetak: localToCetak(l, pasien, patient.dokter) }));
    onListChange(entries);
  }, [isPersisted, serverItems, localItems, patient, onListChange]);

  const jumlah = isPersisted ? serverItems.length : localItems.length;
  const isValid = /^\d{4}-\d{2}-\d{2}$/.test(tglPeriksa);

  function resetForm() {
    setTglPeriksa(tglKunjungan);
    setTinggi(""); setBerat(""); setTekananDarah(""); setNadi("");
    setGolonganDarah("Tidak Diketahui"); setPenglihatan("Normal"); setButaWarna("Normal"); setPendengaran("Normal");
    setRiwayatPenyakit(""); setKesimpulan(KESIMPULAN_OPTS[0]); setKeperluan(KEPERLUAN_OPTS[0]);
    setInstansi(""); setBerlakuHingga(""); setPekerjaan(""); setCatatan("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setError(null);
    setSubmitting(true);
    const payload: SuratSehatInput = {
      tglPeriksa,
      tinggiBadan: toIntOrNull(tinggi), beratBadan: toIntOrNull(berat),
      tekananDarah: tekananDarah.trim(), nadi: toIntOrNull(nadi),
      golonganDarah: golonganDarah === "Tidak Diketahui" ? "" : golonganDarah,
      penglihatan, butaWarna, pendengaran, riwayatPenyakit: riwayatPenyakit.trim(),
      kesimpulan, keperluan, instansi: instansi.trim(), berlakuHingga,
      catatan: catatan.trim(), pekerjaan: pekerjaan.trim(), dokterNama: patient.dokter,
    };
    try {
      if (isPersisted) {
        const dto = await createSuratSehat(kunjunganId, payload);
        setServerItems((prev) => [dto, ...prev]);
      } else {
        setLocalItems((prev) => [{
          id: genSuratId(), tglPeriksa,
          tinggiBadan: payload.tinggiBadan, beratBadan: payload.beratBadan, tekananDarah: payload.tekananDarah,
          nadi: payload.nadi, golonganDarah: payload.golonganDarah, penglihatan, butaWarna, pendengaran,
          riwayatPenyakit: payload.riwayatPenyakit, kesimpulan, keperluan, instansi: payload.instansi,
          berlakuHingga, catatan: payload.catatan, pekerjaan: payload.pekerjaan,
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
        await deleteSuratSehat(kunjunganId, id);
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
    ? serverItems.map((d) => ({ id: d.id, nomor: d.nomor, tglPeriksa: d.tglPeriksa, kesimpulan: d.kesimpulan, ringkas: pemeriksaanSummary(d), tte: !!d.tteToken }))
    : localItems.map((l) => ({ id: l.id, nomor: "(lokal)", tglPeriksa: l.tglPeriksa, kesimpulan: l.kesimpulan, ringkas: pemeriksaanSummary(l), tte: true }));

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
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <CheckCircle size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-700">Surat Keterangan Sehat</p>
            <p className="mt-0.5 text-xs text-slate-400">Pernyataan kondisi sehat jasmani · PMK 269/2008</p>
          </div>
        </div>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-bold",
          jumlah > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
        )}>
          {jumlah} surat
        </span>
      </div>

      {/* Info strip */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[11px] text-slate-500">
        <span><span className="font-semibold text-slate-700">Pasien</span> {patient.name}</span>
        <span><span className="font-semibold text-slate-700">No. RM</span> {patient.noRM}</span>
        <span><span className="font-semibold text-slate-700">Dokter</span> {patient.dokter}</span>
        {!isPersisted && <span className="text-amber-600">Pasien demo — surat tersimpan lokal (tidak dikirim ke server).</span>}
        {isPersisted && <span className="text-slate-400">Nomor surat auto sistem · TTE dokter otomatis saat diterbitkan · cetak resmi dari panel Riwayat.</span>}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4">
        <Field label="Tanggal Pemeriksaan" required className="mb-4 max-w-xs">
          <DatePicker value={tglPeriksa} onChange={setTglPeriksa} clearable={false} />
        </Field>

        {/* Blok pemeriksaan fisik */}
        <div className="mb-1 flex items-center gap-1.5">
          <Activity size={12} className="text-emerald-500" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hasil Pemeriksaan Fisik</p>
        </div>
        <div className="grid gap-4 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 sm:grid-cols-3">
          <Field label="Tinggi Badan (cm)">
            <input type="number" min={0} max={300} value={tinggi} onChange={(e) => setTinggi(e.target.value)} placeholder="cm" className={inputCls} />
          </Field>
          <Field label="Berat Badan (kg)">
            <input type="number" min={0} max={500} value={berat} onChange={(e) => setBerat(e.target.value)} placeholder="kg" className={inputCls} />
          </Field>
          <Field label="Indeks Massa Tubuh (otomatis)">
            <div className="flex h-9.5 items-center rounded-lg border border-dashed border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-700">
              {bmi != null ? `${bmi.toFixed(1)} kg/m²` : "—"}
            </div>
          </Field>

          <Field label="Tekanan Darah (mmHg)">
            <input type="text" value={tekananDarah} onChange={(e) => setTekananDarah(e.target.value)} placeholder="mis. 120/80" className={inputCls} />
          </Field>
          <Field label="Nadi (x/menit)">
            <input type="number" min={0} max={400} value={nadi} onChange={(e) => setNadi(e.target.value)} placeholder="x/menit" className={inputCls} />
          </Field>
          <Field label="Golongan Darah">
            <Select value={golonganDarah} onChange={setGolonganDarah} options={GOLDAR_OPTS} />
          </Field>

          <Field label="Penglihatan / Mata">
            <Select value={penglihatan} onChange={setPenglihatan} options={PENGLIHATAN_OPTS} />
          </Field>
          <Field label="Tes Buta Warna">
            <Select value={butaWarna} onChange={setButaWarna} options={BUTAWARNA_OPTS} />
          </Field>
          <Field label="Pendengaran">
            <Select value={pendengaran} onChange={setPendengaran} options={PENDENGARAN_OPTS} />
          </Field>

          <Field label="Riwayat Penyakit" className="sm:col-span-3">
            <input type="text" value={riwayatPenyakit} onChange={(e) => setRiwayatPenyakit(e.target.value)} placeholder="Opsional — mis. Tidak ada riwayat penyakit kronis" className={inputCls} />
          </Field>
        </div>

        {/* Blok kesimpulan & keperluan */}
        <div className="mb-1 mt-4 flex items-center gap-1.5">
          <CheckCircle size={12} className="text-emerald-500" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kesimpulan & Keperluan</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kesimpulan">
            <Select value={kesimpulan} onChange={setKesimpulan} options={KESIMPULAN_OPTS} />
          </Field>
          <Field label="Keperluan">
            <Select value={keperluan} onChange={setKeperluan} options={KEPERLUAN_OPTS} />
          </Field>
          <Field label="Ditujukan Kepada (instansi/sekolah)">
            <input type="text" value={instansi} onChange={(e) => setInstansi(e.target.value)} placeholder="Opsional — mis. HRD PT. …" className={inputCls} />
          </Field>
          <Field label="Berlaku Hingga (opsional)">
            <DatePicker value={berlakuHingga} onChange={setBerlakuHingga} placeholder="Tanpa batas waktu" />
          </Field>
          <Field label="Pekerjaan Pasien">
            <input type="text" value={pekerjaan} onChange={(e) => setPekerjaan(e.target.value)} placeholder="Opsional" className={inputCls} />
          </Field>
          <Field label="Catatan Tambahan">
            <input type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Opsional" className={inputCls} />
          </Field>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] text-rose-700">
            <Info size={13} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={resetForm}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-600">
            <RotateCcw size={11} /> Reset
          </button>
          <button type="submit" disabled={!isValid || submitting}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition",
              isValid && !submitting ? "bg-emerald-600 hover:bg-emerald-700" : "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none",
            )}>
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
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                  <CheckCircle size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-xs font-semibold text-slate-800">
                    <span className="font-mono">{c.nomor}</span>
                    <span className="font-bold text-emerald-600">{c.kesimpulan}</span>
                    {c.tte && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                        <ShieldCheck size={9} /> TTE
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {fmtTgl(c.tglPeriksa)}{c.ringkas && <> · {c.ringkas}</>}
                  </p>
                </div>
                <button type="button" onClick={() => handleDelete(c.id)} disabled={busyId === c.id}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
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
