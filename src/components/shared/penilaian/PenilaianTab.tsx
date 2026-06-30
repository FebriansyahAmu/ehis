"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Zap, Stethoscope, Baby, Gauge,
  Heart, Microscope, ClipboardCheck, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { getPenilaianFisik, createPenilaianFisik, type PenilaianFisikDTO } from "@/lib/api/penilaian/penilaianFisik";
import { getPenilaianNyeri, createPenilaianNyeri, type PenilaianNyeriDTO } from "@/lib/api/penilaian/penilaianNyeri";
import { getPenilaianStatus, createPenilaianStatus, type PenilaianStatusDTO } from "@/lib/api/penilaian/penilaianStatus";
import { getPenilaianPediatrik, createPenilaianPediatrik, type PenilaianPediatrikDTO } from "@/lib/api/penilaian/penilaianPediatrik";
import { listObservasi } from "@/lib/api/observation";

import SkalaRisikoPanel from "./SkalaRisikoPanel";
import JantungPanel from "./JantungPanel";
import KankerPanel from "./KankerPanel";
import {
  UUID_RE, NOTE_DATE_FMT, inputCls, AutoTextarea, Label, SaveBtn,
  HistoryPanel, TwoPanel, type NoteEntry, type PanelCtx,
} from "./shared";

// ── 1. FISIK ───────────────────────────────────────────────────
const FISIK_NOTES: NoteEntry[] = [
  {
    date: "12 Apr 2025", author: "dr. Hendro Sp.PD", tag: "IGD",
    content: "KU: Tampak sakit sedang\nKesadaran: Compos mentis, GCS E4V5M6\nStatus gizi: Cukup, BB ~68kg\nMobilitas: Dibantu sebagian",
  },
  {
    date: "28 Jan 2025", author: "dr. Sari Sp.PD", tag: "Poli",
    content: "KU: Baik, tidak tampak sakit\nKesadaran: Compos mentis\nStatus gizi: Baik\nMobilitas: Mandiri",
  },
];

// DTO → NoteEntry riwayat (susun teks ringkas KU/Kesadaran/Gizi/Mobilitas + pem. umum).
function fisikToNote(d: PenilaianFisikDTO): NoteEntry {
  const parts: string[] = [];
  if (d.keadaanUmum) parts.push(`KU: ${d.keadaanUmum}`);
  if (d.kesadaran) parts.push(`Kesadaran: ${d.kesadaran}`);
  if (d.gizi) parts.push(`Status gizi: ${d.gizi}`);
  if (d.mobilitas) parts.push(`Mobilitas: ${d.mobilitas}`);
  if (d.pemeriksaanUmum) parts.push(d.pemeriksaanUmum);
  return { date: d.tanggal, author: d.pemeriksa || "—", content: parts.join("\n") };
}

function FisikPanel({ kunjunganId, isPersisted, perawat }: PanelCtx) {
  const [pemFisik, setPemFisik] = useState("");
  const [form, setForm] = useState({ keadaanUmum: "", kesadaran: "", gizi: "", mobilitas: "" });
  const [history, setHistory] = useState<NoteEntry[]>(isPersisted ? [] : FISIK_NOTES);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Muat riwayat tersimpan (kunjungan UUID).
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getPenilaianFisik(kunjunganId, ac.signal)
      .then((rows) => setHistory(rows.map(fisikToNote)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat riwayat penilaian fisik", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  const isEmpty =
    !pemFisik.trim() && !form.keadaanUmum.trim() && !form.kesadaran.trim() && !form.gizi.trim() && !form.mobilitas.trim();

  function resetForm() {
    setPemFisik("");
    setForm({ keadaanUmum: "", kesadaran: "", gizi: "", mobilitas: "" });
  }

  async function handleSave() {
    if (isEmpty || saving) return;
    if (!isPersisted) {
      // Demo (pasien seed) — tampil lokal, tidak persist.
      const local: PenilaianFisikDTO = {
        id: `local-${Date.now()}`, pemeriksaanUmum: pemFisik, ...form,
        pemeriksa: perawat, tanggal: NOTE_DATE_FMT.format(new Date()), waktu: new Date().toISOString(),
      };
      setHistory((h) => [fisikToNote(local), ...h]);
      resetForm();
      toast.info("Pasien demo — penilaian tidak tersimpan ke database");
      return;
    }
    try {
      setSaving(true);
      const dto = await createPenilaianFisik(kunjunganId, {
        pemeriksaanUmum: pemFisik || undefined,
        keadaanUmum: form.keadaanUmum || undefined,
        kesadaran: form.kesadaran || undefined,
        gizi: form.gizi || undefined,
        mobilitas: form.mobilitas || undefined,
      });
      setHistory((h) => [fisikToNote(dto), ...h]);
      resetForm();
      toast.success("Penilaian fisik tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan penilaian fisik", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-3">
          <div>
            <Label>Pemeriksaan Fisik Umum</Label>
            <AutoTextarea
              value={pemFisik}
              onChange={setPemFisik}
              placeholder="Deskripsikan hasil pemeriksaan fisik secara sistematis (kepala, leher, thoraks, abdomen, ekstremitas)..."
              minRows={4}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["keadaanUmum", "Keadaan Umum",  "Baik / Sedang / Berat"],
              ["kesadaran",   "Kesadaran",     "Compos mentis / Apatis / Somnolen"],
              ["gizi",        "Status Gizi",   "Baik / Kurang / Lebih"],
              ["mobilitas",   "Mobilitas",     "Mandiri / Dibantu / Bedrest"],
            ] as [keyof typeof form, string, string][]).map(([key, label, ph]) => (
              <div key={key}>
                <Label>{label}</Label>
                <input value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} className={inputCls} />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <SaveBtn label="Simpan Penilaian Fisik" onClick={handleSave} disabled={isEmpty} loading={saving} />
          </div>
        </div>
      }
      history={<HistoryPanel title="Pemeriksaan Fisik" notes={history} />}
    />
  );
}

// ── 2. NYERI ───────────────────────────────────────────────────
const NYERI_NOTES: NoteEntry[] = [
  {
    date: "12 Apr 2025", author: "dr. Hendro Sp.PD", tag: "IGD",
    content: "NRS: 7 — Nyeri Berat\nLokasi: Dada kiri menjalar ke lengan kiri\nKarakter: Terjepet, berat\nDurasi: Terus-menerus ±2 jam",
  },
];

// DTO → NoteEntry riwayat (karakterisasi PQRST; skor NRS tidak di sini — itu milik TTV).
function nyeriToNote(d: PenilaianNyeriDTO): NoteEntry {
  const parts: string[] = [];
  if (d.lokasi) parts.push(`Lokasi: ${d.lokasi}`);
  if (d.tipeNyeri) parts.push(`Tipe: ${d.tipeNyeri}`);
  if (d.karakter) parts.push(`Karakter: ${d.karakter}`);
  if (d.durasi) parts.push(`Durasi: ${d.durasi}`);
  if (d.faktorPemberat) parts.push(`Pemberat: ${d.faktorPemberat}`);
  if (d.faktorPeringan) parts.push(`Peringan: ${d.faktorPeringan}`);
  if (d.dampakFungsional) parts.push(`Dampak: ${d.dampakFungsional}`);
  if (d.rencanaReasesmen) parts.push(`Reasesmen: ${d.rencanaReasesmen}`);
  if (d.catatan) parts.push(d.catatan);
  return { date: d.tanggal, author: d.pemeriksa || "—", content: parts.join("\n") };
}

// Severity NRS (0–10) → label + warna (dipakai banner skor TTV read-only).
function nrsLevel(score: number) {
  return score === 0 ? { label: "Tidak Nyeri",       cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" }
    : score <= 3     ? { label: "Nyeri Ringan",       cls: "bg-sky-100 text-sky-700 ring-1 ring-sky-200" }
    : score <= 6     ? { label: "Nyeri Sedang",       cls: "bg-amber-100 text-amber-700 ring-1 ring-amber-200" }
    : score <= 9     ? { label: "Nyeri Berat",        cls: "bg-orange-100 text-orange-700 ring-1 ring-orange-200" }
    :                  { label: "Nyeri Sangat Berat", cls: "bg-rose-100 text-rose-700 ring-1 ring-rose-200" };
}

const EMPTY_NYERI = {
  lokasi: "", karakter: "", durasi: "", faktorPemberat: "", faktorPeringan: "",
  tipeNyeri: "", dampakFungsional: "", rencanaReasesmen: "", catatan: "",
};
const TIPE_NYERI_OPTS = ["Nosiseptif", "Neuropatik", "Campuran"];

// Asesmen nyeri KOMPREHENSIF (karakterisasi). Skor NRS = single source di TTV (read-only di sini).
function NyeriPanel({ kunjunganId, isPersisted, perawat }: PanelCtx) {
  const [form, setForm] = useState(EMPTY_NYERI);
  const [ttv, setTtv] = useState<{ skor: number; tanggal: string; jam: string } | null>(null);
  const [history, setHistory] = useState<NoteEntry[]>(isPersisted ? [] : NYERI_NOTES);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Skor NRS terkini dari TTV/Observation (read-only) + riwayat asesmen (kunjungan UUID).
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    listObservasi(kunjunganId, ac.signal)
      .then((rows) => {
        const latest = rows[0]; // terbaru dulu
        setTtv(latest ? { skor: latest.vitalSigns.skalaNyeri, tanggal: latest.tanggal, jam: latest.jam } : null);
      })
      .catch(() => { /* 403/kosong → banner empty-state */ });
    getPenilaianNyeri(kunjunganId, ac.signal)
      .then((rows) => setHistory(rows.map(nyeriToNote)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat riwayat asesmen nyeri", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  const isEmpty = !Object.values(form).some((v) => v.trim());

  async function handleSave() {
    if (isEmpty || saving) return;
    if (!isPersisted) {
      const local: PenilaianNyeriDTO = {
        id: `local-${Date.now()}`, ...form, pemeriksa: perawat,
        tanggal: NOTE_DATE_FMT.format(new Date()), waktu: new Date().toISOString(),
      };
      setHistory((h) => [nyeriToNote(local), ...h]);
      setForm(EMPTY_NYERI);
      toast.info("Pasien demo — asesmen tidak tersimpan ke database");
      return;
    }
    try {
      setSaving(true);
      const dto = await createPenilaianNyeri(kunjunganId, {
        lokasi: form.lokasi || undefined,
        karakter: form.karakter || undefined,
        durasi: form.durasi || undefined,
        faktorPemberat: form.faktorPemberat || undefined,
        faktorPeringan: form.faktorPeringan || undefined,
        tipeNyeri: form.tipeNyeri || undefined,
        dampakFungsional: form.dampakFungsional || undefined,
        rencanaReasesmen: form.rencanaReasesmen || undefined,
        catatan: form.catatan || undefined,
      });
      setHistory((h) => [nyeriToNote(dto), ...h]);
      setForm(EMPTY_NYERI);
      toast.success("Asesmen nyeri tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan asesmen nyeri", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  const lvl = ttv ? nrsLevel(ttv.skor) : null;

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-3.5">
          {/* Skor NRS terkini — SINGLE SOURCE dari TTV (read-only) */}
          {ttv && lvl ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Zap size={16} className="shrink-0 text-sky-400" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Skor Nyeri Terkini · dari TTV</p>
                <p className="text-xs text-slate-500">Diukur {ttv.tanggal} · {ttv.jam} — skor NRS diisi di tab TTV (tanda vital)</p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", lvl.cls)}>
                {ttv.skor} — {lvl.label}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
              <Zap size={14} className="shrink-0 text-slate-300" aria-hidden />
              Skor NRS belum ada — isi <span className="font-semibold text-slate-600">skala nyeri di tab TTV</span> (tanda vital). Asesmen ini melengkapi karakterisasinya.
            </div>
          )}

          {/* Karakterisasi (PQRST) */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Lokasi Nyeri</Label>
              <input value={form.lokasi} onChange={(e) => set("lokasi", e.target.value)} placeholder="Dada kiri menjalar ke lengan..." className={inputCls} />
            </div>
            <div>
              <Label>Karakter Nyeri</Label>
              <input value={form.karakter} onChange={(e) => set("karakter", e.target.value)} placeholder="Tumpul, tajam, terbakar, terjepit..." className={inputCls} />
            </div>
          </div>

          <div>
            <Label>Tipe Nyeri</Label>
            <div className="flex flex-wrap gap-1.5">
              {TIPE_NYERI_OPTS.map((opt) => (
                <button key={opt} type="button" onClick={() => set("tipeNyeri", opt === form.tipeNyeri ? "" : opt)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all",
                    form.tipeNyeri === opt
                      ? "border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                      : "border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:text-sky-600",
                  )}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ["durasi",         "Durasi",          "Intermiten, terus-menerus..."],
              ["faktorPemberat", "Faktor Pemberat", "Aktivitas, batuk, menelan..."],
              ["faktorPeringan", "Faktor Peringan", "Istirahat, obat, posisi..."],
            ] as [keyof typeof form, string, string][]).map(([key, label, ph]) => (
              <div key={key}>
                <Label>{label}</Label>
                <input value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} className={inputCls} />
              </div>
            ))}
          </div>

          <div>
            <Label>Dampak Fungsional</Label>
            <input value={form.dampakFungsional} onChange={(e) => set("dampakFungsional", e.target.value)} placeholder="Pengaruh ke tidur, aktivitas, mobilisasi..." className={inputCls} />
          </div>

          <div>
            <Label>Rencana Reasesmen</Label>
            <input value={form.rencanaReasesmen} onChange={(e) => set("rencanaReasesmen", e.target.value)} placeholder="Mis. evaluasi ulang 30 menit pasca-analgesik" className={inputCls} />
          </div>

          <div>
            <Label>Catatan Tambahan</Label>
            <AutoTextarea value={form.catatan} onChange={(v) => set("catatan", v)} placeholder="Karakteristik lain, respon terapi..." minRows={2} />
          </div>

          <div className="flex justify-end">
            <SaveBtn label="Simpan Asesmen Nyeri" onClick={handleSave} disabled={isEmpty} loading={saving} />
          </div>
        </div>
      }
      history={<HistoryPanel title="Asesmen Nyeri" notes={history} />}
    />
  );
}

// ── 3. STATUS KLINIS ───────────────────────────────────────────
const STATUS_OPTS = ["Stabil", "Tidak Stabil", "Kritis", "Mengancam Jiwa", "Meninggal"];
const KESADARAN_OPTS = ["Compos Mentis", "Apatis", "Somnolen", "Sopor", "Koma"];
const EMPTY_STATUS = { status: "", kesadaran: "", catatan: "" };

// DTO → NoteEntry riwayat.
function statusToNote(d: PenilaianStatusDTO): NoteEntry {
  const parts: string[] = [];
  if (d.status) parts.push(`Status: ${d.status}`);
  if (d.kesadaran) parts.push(`Kesadaran: ${d.kesadaran}`);
  if (d.catatan) parts.push(d.catatan);
  return { date: d.tanggal, author: d.pemeriksa || "—", content: parts.join("\n") };
}

function StatusPanel({ kunjunganId, isPersisted, perawat }: PanelCtx) {
  const [form, setForm] = useState(EMPTY_STATUS);
  const [history, setHistory] = useState<NoteEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Riwayat penilaian status (kunjungan UUID).
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getPenilaianStatus(kunjunganId, ac.signal)
      .then((rows) => setHistory(rows.map(statusToNote)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat riwayat status klinis", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  const isEmpty = !Object.values(form).some((v) => v.trim());

  const pillCls = (active: boolean) => cn(
    "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all",
    active
      ? "border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200"
      : "border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:text-sky-600",
  );

  async function handleSave() {
    if (isEmpty || saving) return;
    if (!isPersisted) {
      const local: PenilaianStatusDTO = {
        id: `local-${Date.now()}`, ...form, pemeriksa: perawat,
        tanggal: NOTE_DATE_FMT.format(new Date()), waktu: new Date().toISOString(),
      };
      setHistory((h) => [statusToNote(local), ...h]);
      setForm(EMPTY_STATUS);
      toast.info("Pasien demo — penilaian tidak tersimpan ke database");
      return;
    }
    try {
      setSaving(true);
      const dto = await createPenilaianStatus(kunjunganId, {
        status: form.status || undefined,
        kesadaran: form.kesadaran || undefined,
        catatan: form.catatan || undefined,
      });
      setHistory((h) => [statusToNote(dto), ...h]);
      setForm(EMPTY_STATUS);
      toast.success("Status klinis tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan status klinis", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-3">
          <div>
            <Label>Status Klinis</Label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTS.map((opt) => (
                <button key={opt} type="button" onClick={() => set("status", opt === form.status ? "" : opt)} className={pillCls(form.status === opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Tingkat Kesadaran</Label>
            <div className="flex flex-wrap gap-1.5">
              {KESADARAN_OPTS.map((opt) => (
                <button key={opt} type="button" onClick={() => set("kesadaran", opt === form.kesadaran ? "" : opt)} className={pillCls(form.kesadaran === opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Catatan Status Klinis</Label>
            <AutoTextarea value={form.catatan} onChange={(v) => set("catatan", v)} placeholder="Kondisi pasien saat ini, temuan klinis relevan..." minRows={3} />
          </div>
          <div className="flex justify-end">
            <SaveBtn label="Simpan Status Klinis" onClick={handleSave} disabled={isEmpty} loading={saving} />
          </div>
        </div>
      }
      history={<HistoryPanel title="Status Klinis" notes={history} />}
    />
  );
}

// ── 4. PEDIATRIK ───────────────────────────────────────────────
const EMPTY_PEDIATRIK = { beratLahir: "", usiaGestasi: "", imunisasi: "", tumbuhKembang: "", catatan: "" };

// DTO → NoteEntry riwayat.
function pediatrikToNote(d: PenilaianPediatrikDTO): NoteEntry {
  const parts: string[] = [];
  if (d.beratLahir) parts.push(`Berat lahir: ${d.beratLahir}`);
  if (d.usiaGestasi) parts.push(`Usia gestasi: ${d.usiaGestasi}`);
  if (d.imunisasi) parts.push(`Imunisasi: ${d.imunisasi}`);
  if (d.tumbuhKembang) parts.push(`Tumbuh kembang: ${d.tumbuhKembang}`);
  if (d.catatan) parts.push(d.catatan);
  return { date: d.tanggal, author: d.pemeriksa || "—", content: parts.join("\n") };
}

function PediatrikPanel({ kunjunganId, isPersisted, perawat }: PanelCtx) {
  const [form, setForm] = useState(EMPTY_PEDIATRIK);
  const [history, setHistory] = useState<NoteEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Riwayat penilaian pediatrik (kunjungan UUID).
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getPenilaianPediatrik(kunjunganId, ac.signal)
      .then((rows) => setHistory(rows.map(pediatrikToNote)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat riwayat pediatrik", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  const isEmpty = !Object.values(form).some((v) => v.trim());

  async function handleSave() {
    if (isEmpty || saving) return;
    if (!isPersisted) {
      const local: PenilaianPediatrikDTO = {
        id: `local-${Date.now()}`, ...form, pemeriksa: perawat,
        tanggal: NOTE_DATE_FMT.format(new Date()), waktu: new Date().toISOString(),
      };
      setHistory((h) => [pediatrikToNote(local), ...h]);
      setForm(EMPTY_PEDIATRIK);
      toast.info("Pasien demo — penilaian tidak tersimpan ke database");
      return;
    }
    try {
      setSaving(true);
      const dto = await createPenilaianPediatrik(kunjunganId, {
        beratLahir: form.beratLahir || undefined,
        usiaGestasi: form.usiaGestasi || undefined,
        imunisasi: form.imunisasi || undefined,
        tumbuhKembang: form.tumbuhKembang || undefined,
        catatan: form.catatan || undefined,
      });
      setHistory((h) => [pediatrikToNote(dto), ...h]);
      setForm(EMPTY_PEDIATRIK);
      toast.success("Status pediatrik tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan status pediatrik", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <TwoPanel
      form={
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["beratLahir",    "Berat Lahir",      "Contoh: 3200 gram"],
              ["usiaGestasi",   "Usia Gestasi",     "Contoh: 38 minggu"],
              ["imunisasi",     "Status Imunisasi", "Lengkap / Tidak lengkap"],
              ["tumbuhKembang", "Tumbuh Kembang",   "Sesuai usia / Terlambat"],
            ] as [keyof typeof form, string, string][]).map(([key, label, ph]) => (
              <div key={key}>
                <Label>{label}</Label>
                <input value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={ph} className={inputCls} />
              </div>
            ))}
          </div>
          <div>
            <Label>Catatan Pediatrik</Label>
            <AutoTextarea value={form.catatan} onChange={(v) => set("catatan", v)} placeholder="Riwayat tumbuh kembang, kondisi khusus, riwayat terapi..." minRows={3} />
          </div>
          <div className="flex justify-end">
            <SaveBtn label="Simpan Status Pediatrik" onClick={handleSave} disabled={isEmpty} loading={saving} />
          </div>
        </div>
      }
      history={<HistoryPanel title="Status Pediatrik" notes={history} />}
    />
  );
}

// ── 5. DIAGNOSIS — DI-DROP (2026-06-15) ────────────────────────
//  Sub-menu Diagnosis dihapus: redundan dgn tab Diagnosa (ICD terkode — tipe Komorbid · status
//  Diferensial · alasan/analisa per diagnosis) + CPPT (rencana tatalaksana = SOAP "P"). Single
//  source diagnosis = tab Diagnosa (billable INA-CBG/iDRG). Tak ada tabel `penilaian_diagnosis`.

// ── 6. ASESMEN RISIKO (generik, master-driven) ────────────────
//  Morse/Braden/Barthel + 10 skala lain TIDAK lagi hardcode di sini — ditarik dari master
//  `master.SkalaInstrument` (ter-assign unit via konsumenModul) lewat <SkalaRisikoPanel>,
//  dirender generik & disimpan ke medicalrecord.penilaian_skala (append-only snapshot).
//  Lihat ./penilaian/SkalaRisikoPanel.tsx.

// ── 9. JANTUNG & 10. KANKER — komposit master-driven ─────────
//  Dipindah ke ./penilaian/JantungPanel.tsx & ./penilaian/KankerPanel.tsx: klasifikasi baku
//  (Killip/NYHA/TIMI · ECOG/Grade/Stadium) ditarik dari master Skala Penyakit + narasi/vocab
//  bespoke, disimpan ke medicalrecord.penilaian_komposit (snapshot). TNM tetap vocab (bukan skala).

// ── Tab registry ───────────────────────────────────────────────
type TabDef = { id: string; short: string; title: string; icon: LucideIcon; content: (ctx: PanelCtx) => ReactNode };

const TABS: TabDef[] = [
  { id: "fisik",     short: "Fisik",       title: "Penilaian Fisik",      icon: Activity,    content: (ctx) => <FisikPanel {...ctx} /> },
  { id: "nyeri",     short: "Nyeri",       title: "Asesmen Nyeri",        icon: Zap,         content: (ctx) => <NyeriPanel {...ctx} /> },
  { id: "status",    short: "Status",      title: "Status Klinis",        icon: Stethoscope, content: (ctx) => <StatusPanel {...ctx} /> },
  { id: "pediatrik", short: "Pediatrik",   title: "Status Pediatrik",     icon: Baby,        content: (ctx) => <PediatrikPanel {...ctx} /> },
  { id: "skala",     short: "Asesmen Risiko", title: "Asesmen Risiko (Skala)", icon: Gauge,    content: (ctx) => <SkalaRisikoPanel {...ctx} /> },
  { id: "jantung",   short: "Jantung",     title: "Penilaian Jantung",    icon: Heart,       content: (ctx) => <JantungPanel {...ctx} /> },
  { id: "kanker",    short: "Kanker",      title: "Penilaian Kanker",     icon: Microscope,  content: (ctx) => <KankerPanel {...ctx} /> },
];

// ── Main ───────────────────────────────────────────────────────
// Shared lintas-unit (IGD/RI/…): `modul` mem-filter master skala (konsumenModul);
// `kunjunganId` kunci domain medicalrecord.penilaian_*; `perawat` dari sesi login.
export default function PenilaianTab({ kunjunganId, modul }: { kunjunganId: string; modul: string }) {
  const { session } = useSession();
  const ctx: PanelCtx = {
    kunjunganId,
    isPersisted: UUID_RE.test(kunjunganId),
    perawat: session?.namaTampil ?? "",
    modul, // unit konsumen — filter master skala (konsumenModul)
  };
  const [activeId, setActiveId] = useState("fisik");
  const tabBarRef = useRef<HTMLDivElement>(null);
  const activeTab = TABS.find((t) => t.id === activeId) ?? TABS[0];

  useEffect(() => {
    const el = tabBarRef.current?.querySelector(`[data-tabid="${activeId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeId]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <ClipboardCheck size={14} className="text-sky-500" />
        <span className="text-xs font-semibold text-slate-700">Penilaian Klinis</span>
        <span className="ml-auto text-xs text-slate-400">{activeTab.title}</span>
      </div>

      {/* Scrollable tab bar */}
      <div
        ref={tabBarRef}
        className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xs"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeId;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              data-tabid={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
              )}
            >
              <Icon size={11} />
              <span>{tab.short}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
        >
          {activeTab.content(ctx)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
