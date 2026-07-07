"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ScanLine, FlaskConical, Plus, Trash2, Upload, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { DateTimePicker, Select } from "@/components/shared/inputs";
import { listPetugasKunjungan } from "@/lib/api/penugasanRuangan";
import {
  getPemeriksaanFisik, createPemeriksaanFisik, type PemeriksaanFisikDTO,
} from "@/lib/api/pemeriksaan/pemeriksaanFisik";
import {
  getPenandaanAnatomi, createPenandaanAnatomi, updatePenandaanAnatomi, deletePenandaanAnatomi,
} from "@/lib/api/pemeriksaan/penandaanAnatomi";
import {
  getPemeriksaanPenunjang, createPemeriksaanPenunjang, deletePemeriksaanPenunjang,
} from "@/lib/api/pemeriksaan/pemeriksaanPenunjang";
import StatusFisikPane, { type PemeriksaanFormState, emptyFormState } from "@/components/shared/medical-records/pemeriksaan/StatusFisikPane";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Datetime helpers (kontrak DateTimePicker = "YYYY-MM-DDTHH:mm" lokal) ────────
function nowLocalDT(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function isoToLocalDT(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function localToIso(local: string): string {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
function dtDate(local: string): string { return local.split("T")[0] ?? local; }
function dtTime(local: string): string { return (local.split("T")[1] ?? "").slice(0, 5); }
function localMarkId(): string { return `pa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// Label tampilan datetime untuk hasil penunjang (path mock; persisted pakai DTO tanggal/jam).
const PENUNJANG_DT_FMT = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
});
function fmtLocalDT(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? local : PENUNJANG_DT_FMT.format(d);
}

// ── Types ──────────────────────────────────────────────────

type SubTab = "fisik" | "anatomi" | "penunjang";

interface HasilEntry {
  id: string;
  jenis: string;
  nama: string;       // keterangan/detail pemeriksaan (opsional)
  hasil: string;      // interpretasi / temuan klinis (utama)
  kesimpulan: string; // kesan (opsional)
  waktuLabel: string; // tampilan "DD Mon YYYY · HH:mm"
}

// ── Sub-tab config ─────────────────────────────────────────

const SUB_TABS: { id: SubTab; label: string; Icon: IconComponent }[] = [
  { id: "fisik",     label: "Fisik",      Icon: Activity    },
  { id: "anatomi",   label: "Anatomi",    Icon: ScanLine    },
  { id: "penunjang", label: "Penunjang",  Icon: FlaskConical},
];

// ── Metadata header ────────────────────────────────────────

function MetaHeader({
  waktu, dokter, perawat, dokterOptions, onWaktu, onDokter,
}: {
  waktu: string; dokter: string; perawat: string;
  dokterOptions: string[];
  onWaktu: (v: string) => void;
  onDokter: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs sm:grid-cols-3">
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal &amp; Waktu</p>
        <DateTimePicker value={waktu} onChange={onWaktu} className="w-full text-xs" />
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dokter Pemeriksa</p>
        <Select
          value={dokter}
          onChange={onDokter}
          options={dokterOptions}
          icon={User}
          placeholder="Pilih dokter ter-assign…"
          className="w-full text-xs"
        />
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Perawat</p>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">
          <User size={13} className="shrink-0 text-slate-400" />
          <span className="truncate font-medium">{perawat || "—"}</span>
        </div>
      </div>
    </div>
  );
}

// ── ANATOMI pane ───────────────────────────────────────────

const BODY_REGIONS = [
  { id: "kepala",         label: "Kepala",         col: 2, row: 1 },
  { id: "leher",          label: "Leher",          col: 2, row: 2 },
  { id: "dada_kiri",      label: "Dada Kiri",      col: 1, row: 3 },
  { id: "dada_kanan",     label: "Dada Kanan",     col: 3, row: 3 },
  { id: "abdomen",        label: "Abdomen",        col: 2, row: 4 },
  { id: "pinggang_kiri",  label: "Pinggang Kiri",  col: 1, row: 4 },
  { id: "pinggang_kanan", label: "Pinggang Kanan", col: 3, row: 4 },
  { id: "panggul",        label: "Panggul",        col: 2, row: 5 },
  { id: "paha_kiri",      label: "Paha Kiri",      col: 1, row: 6 },
  { id: "paha_kanan",     label: "Paha Kanan",     col: 3, row: 6 },
  { id: "lutut_kiri",     label: "Lutut Kiri",     col: 1, row: 7 },
  { id: "lutut_kanan",    label: "Lutut Kanan",    col: 3, row: 7 },
  { id: "kaki_kiri",      label: "Kaki Kiri",      col: 1, row: 8 },
  { id: "kaki_kanan",     label: "Kaki Kanan",     col: 3, row: 8 },
  { id: "bahu_kiri",      label: "Bahu Kiri",      col: 0, row: 3 },
  { id: "bahu_kanan",     label: "Bahu Kanan",     col: 4, row: 3 },
  { id: "lengan_kiri",    label: "Lengan Kiri",    col: 0, row: 4 },
  { id: "lengan_kanan",   label: "Lengan Kanan",   col: 4, row: 4 },
  { id: "tangan_kiri",    label: "Tangan Kiri",    col: 0, row: 5 },
  { id: "tangan_kanan",   label: "Tangan Kanan",   col: 4, row: 5 },
];

interface RegionNote { id: string; region: string; label: string; catatan: string }

function AnatomiPane({ kunjunganId, isPersisted }: { kunjunganId: string; isPersisted: boolean }) {
  const [notes, setNotes]       = useState<RegionNote[]>([]);
  const [editing, setEditing]   = useState<string | null>(null); // by note id
  const [editText, setEditText] = useState("");

  const selected = useMemo(() => new Set(notes.map((n) => n.region)), [notes]);

  // Muat penanda tersimpan (kunjungan UUID).
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getPenandaanAnatomi(kunjunganId, ac.signal)
      .then((rows) => setNotes(rows.map((r) => ({ id: r.id, region: r.region, label: r.label, catatan: r.catatan }))))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat penandaan anatomi", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  async function addRegion(id: string, label: string) {
    if (!isPersisted) {
      const localId = localMarkId();
      setNotes((n) => [...n, { id: localId, region: id, label, catatan: "" }]);
      setEditing(localId); setEditText("");
      return;
    }
    try {
      const dto = await createPenandaanAnatomi(kunjunganId, { region: id, label });
      setNotes((n) => [...n, { id: dto.id, region: dto.region, label: dto.label, catatan: dto.catatan }]);
      setEditing(dto.id); setEditText("");
      toast.success("Area ditandai", dto.label);
    } catch (e) {
      toast.error("Gagal menandai area", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function removeRegion(note: RegionNote) {
    if (editing === note.id) setEditing(null);
    if (!isPersisted) { setNotes((n) => n.filter((r) => r.id !== note.id)); return; }
    try {
      await deletePenandaanAnatomi(kunjunganId, note.id);
      setNotes((n) => n.filter((r) => r.id !== note.id));
    } catch (e) {
      toast.error("Gagal menghapus tanda", e instanceof ApiError ? e.message : undefined);
    }
  }

  function toggleRegion(id: string, label: string) {
    const existing = notes.find((n) => n.region === id);
    if (existing) removeRegion(existing); else addRegion(id, label);
  }

  async function saveNote(note: RegionNote) {
    const catatan = editText;
    if (!isPersisted) {
      setNotes((p) => p.map((n) => (n.id === note.id ? { ...n, catatan } : n)));
      setEditing(null);
      return;
    }
    try {
      const dto = await updatePenandaanAnatomi(kunjunganId, note.id, { catatan });
      setNotes((p) => p.map((n) => (n.id === note.id ? { ...n, catatan: dto.catatan } : n)));
      setEditing(null);
      toast.success("Catatan tersimpan", note.label);
    } catch (e) {
      toast.error("Gagal menyimpan catatan", e instanceof ApiError ? e.message : undefined);
    }
  }

  const gridCols = 5;
  const gridRows = 8;
  const grid: (typeof BODY_REGIONS[0] | null)[][] = Array.from({ length: gridRows }, (_, r) =>
    Array.from({ length: gridCols }, (_, c) =>
      BODY_REGIONS.find((b) => b.row === r + 1 && b.col === c) ?? null
    )
  );

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-4">
      {/* Body grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:w-64 md:shrink-0">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Klik area tubuh untuk menandai
        </p>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {grid.flat().map((region, idx) =>
            region ? (
              <button
                key={region.id}
                onClick={() => toggleRegion(region.id, region.label)}
                title={region.label}
                className={cn(
                  "cursor-pointer rounded px-1 py-1.5 text-[9px] font-medium leading-tight transition-colors",
                  selected.has(region.id)
                    ? "bg-rose-500 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-700",
                )}
              >
                {region.label.split(" ").map((w) => w[0]).join("")}
              </button>
            ) : (
              <div key={idx} />
            )
          )}
        </div>
        <p className="mt-2 text-[10px] text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500 mr-1" />
          Area yang ditandai
        </p>
      </div>

      {/* Notes */}
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-xs font-semibold text-slate-700">
          Catatan Area Tubuh
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {selected.size}
          </span>
        </p>
        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-xs text-slate-400 shadow-xs">
            Klik area tubuh di kiri untuk menandai dan mencatat temuan
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-rose-100 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">{n.label}</span>
                <button
                  onClick={() => removeRegion(n)}
                  aria-label="Hapus"
                  className="shrink-0 cursor-pointer text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {editing === n.id ? (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveNote(n); } }}
                    placeholder="Temuan / catatan..."
                    className="flex-1 border-b border-slate-200 bg-transparent py-1 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={() => saveNote(n)}
                    className="cursor-pointer rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-indigo-700"
                  >
                    Simpan
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditing(n.id); setEditText(n.catatan); }}
                  className="mt-1.5 w-full cursor-pointer text-left text-[11px] text-slate-500 hover:text-indigo-600"
                >
                  {n.catatan || <span className="italic text-slate-300">Klik untuk tambah catatan...</span>}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── PENUNJANG pane ─────────────────────────────────────────

// Penunjang bedside/diagnostik di luar Lab & Radiologi (keduanya punya tab/modul sendiri;
// USG = modalitas radiologi → dikelola di tab Radiologi). Hasil bersifat interpretatif.
const JENIS_OPTIONS = ["EKG", "Spirometri", "EEG", "EMG", "Audiometri", "Ekokardiografi", "Treadmill Test", "Lainnya"];

interface PenunjangForm { jenis: string; nama: string; hasil: string; kesimpulan: string; waktu: string }

function PenunjangPane({ kunjunganId, isPersisted }: { kunjunganId: string; isPersisted: boolean }) {
  const [entries, setEntries] = useState<HasilEntry[]>([]);
  const [form, setForm] = useState<PenunjangForm>({
    jenis: "EKG", nama: "", hasil: "", kesimpulan: "", waktu: nowLocalDT(),
  });
  const set = (k: keyof PenunjangForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Muat hasil tersimpan (kunjungan UUID).
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getPemeriksaanPenunjang(kunjunganId, ac.signal)
      .then((rows) => setEntries(rows.map((r) => ({
        id: r.id, jenis: r.jenis, nama: r.keterangan, hasil: r.hasil, kesimpulan: r.kesimpulan,
        waktuLabel: [r.tanggal, r.jam].filter(Boolean).join(" · "),
      }))))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat pemeriksaan penunjang", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  async function handleAdd() {
    if (!form.hasil.trim()) return;
    if (!isPersisted) {
      setEntries((p) => [{
        id: `p-${Date.now()}`, jenis: form.jenis, nama: form.nama, hasil: form.hasil,
        kesimpulan: form.kesimpulan, waktuLabel: fmtLocalDT(form.waktu),
      }, ...p]);
      setForm((p) => ({ ...p, nama: "", hasil: "", kesimpulan: "" }));
      return;
    }
    try {
      const dto = await createPemeriksaanPenunjang(kunjunganId, {
        jenis: form.jenis,
        keterangan: form.nama || undefined,
        hasil: form.hasil,
        kesimpulan: form.kesimpulan || undefined,
        waktu: form.waktu ? localToIso(form.waktu) : undefined,
      });
      setEntries((p) => [{
        id: dto.id, jenis: dto.jenis, nama: dto.keterangan, hasil: dto.hasil, kesimpulan: dto.kesimpulan,
        waktuLabel: [dto.tanggal, dto.jam].filter(Boolean).join(" · "),
      }, ...p]);
      setForm((p) => ({ ...p, nama: "", hasil: "", kesimpulan: "" }));
      toast.success("Hasil penunjang ditambahkan", dto.jenis);
    } catch (e) {
      toast.error("Gagal menambah penunjang", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDelete(id: string) {
    if (!isPersisted) { setEntries((p) => p.filter((e) => e.id !== id)); return; }
    try {
      await deletePemeriksaanPenunjang(kunjunganId, id);
      setEntries((p) => p.filter((e) => e.id !== id));
    } catch (e) {
      toast.error("Gagal menghapus penunjang", e instanceof ApiError ? e.message : undefined);
    }
  }

  const grouped = entries.reduce<Record<string, HasilEntry[]>>((acc, e) => {
    (acc[e.jenis] ??= []).push(e);
    return acc;
  }, {});

  const inputCls = "w-full border-b border-slate-200 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400";
  const labelCls = "mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400";

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-4">
      {/* Form */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:w-72 md:shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Tambah Pemeriksaan Penunjang</p>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Jenis</p>
          <div className="flex flex-wrap gap-1">
            {JENIS_OPTIONS.map((j) => (
              <button
                key={j}
                onClick={() => set("jenis", j)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors",
                  form.jenis === j
                    ? "bg-indigo-600 text-white ring-indigo-600"
                    : "bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300",
                )}
              >
                {j}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={labelCls}>Keterangan <span className="font-normal lowercase text-slate-300">(opsional)</span></p>
          <input
            value={form.nama}
            onChange={(e) => set("nama", e.target.value)}
            placeholder="Mis. EKG 12 sadapan, spirometri post-bronkodilator..."
            className={inputCls}
          />
        </div>

        <div>
          <p className={labelCls}>Hasil / Interpretasi</p>
          <textarea
            value={form.hasil}
            onChange={(e) => set("hasil", e.target.value)}
            rows={3}
            placeholder="Mis. Sinus rhythm, HR 88x/mnt, axis normal, tanpa tanda iskemia akut"
            className={cn(inputCls, "resize-none leading-relaxed")}
          />
        </div>

        <div>
          <p className={labelCls}>Kesimpulan / Kesan <span className="font-normal lowercase text-slate-300">(opsional)</span></p>
          <input
            value={form.kesimpulan}
            onChange={(e) => set("kesimpulan", e.target.value)}
            placeholder="Mis. EKG dalam batas normal"
            className={inputCls}
          />
        </div>

        <div>
          <p className={labelCls}>Tanggal &amp; Waktu</p>
          <DateTimePicker value={form.waktu} onChange={(v) => set("waktu", v)} className="w-full text-xs" />
        </div>

        <button
          onClick={handleAdd}
          disabled={!form.hasil.trim()}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={12} />
          Tambah Penunjang
        </button>
      </div>

      {/* Results */}
      <div className="flex flex-1 flex-col gap-3">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-5 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30">
          <Upload size={18} className="text-slate-300" />
          <span className="text-xs font-medium text-slate-500">Upload file hasil penunjang (EKG, spirometri, dll.)</span>
          <span className="text-[11px] text-slate-400">PDF, JPG, PNG — maks. 10 MB</span>
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
        </label>

        {Object.keys(grouped).length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-xs text-slate-400 shadow-xs">
            Belum ada hasil pemeriksaan penunjang
          </div>
        ) : (
          Object.entries(grouped).map(([jenis, items]) => (
            <div key={jenis} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2">
                <span className="text-[11px] font-semibold text-slate-600">{jenis}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{items.length}</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li key={item.id} className="px-4 py-3 transition-colors hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {item.nama && <p className="text-xs font-semibold text-slate-700">{item.nama}</p>}
                        <p className={cn("whitespace-pre-wrap text-xs text-slate-600", item.nama && "mt-0.5")}>{item.hasil}</p>
                        {item.kesimpulan && (
                          <p className="mt-1.5 inline-flex rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                            Kesan: {item.kesimpulan}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {item.waktuLabel && <span className="text-[10px] text-slate-400">{item.waktuLabel}</span>}
                        <button
                          onClick={() => handleDelete(item.id)}
                          aria-label="Hapus"
                          className="cursor-pointer text-slate-300 transition-colors hover:text-rose-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── DTO → form state (prefill latest) ──────────────────────

function dtoToFormState(d: PemeriksaanFisikDTO): PemeriksaanFormState {
  return {
    tanggal: d.tanggal, jam: d.jam, dokter: d.dokter, perawat: d.perawat,
    ku: d.ku as PemeriksaanFormState["ku"],
    kesadaran: d.kesadaran as PemeriksaanFormState["kesadaran"],
    gizi: d.gizi as PemeriksaanFormState["gizi"],
    mobilitas: d.mobilitas as PemeriksaanFormState["mobilitas"],
    orientasi: d.orientasi,
    catatanGeneralis: d.catatanGeneralis,
    sistem: d.sistem as PemeriksaanFormState["sistem"],
    temuanAbnormal: d.temuanAbnormal,
    temuanLain: d.temuanLain,
    catatanUmum: d.catatanUmum,
    bodyMarkings: d.bodyMarkings,
  };
}

// ── Main ──────────────────────────────────────────────────

// Tab Pemeriksaan Fisik shared (IGD/RJ). Unit dibedakan lewat props (bukan fork):
//  kunjunganId = id kunjungan (UUID → mode DB, selain itu demo lokal);
//  dokterFallback = DPJP header unit → opsi dokter bila roster kosong.
export interface PemeriksaanFisikTabProps {
  kunjunganId: string;
  dokterFallback?: string;
}

export default function PemeriksaanFisikTab({ kunjunganId, dokterFallback }: PemeriksaanFisikTabProps) {
  const { session } = useSession();
  const isPersisted = UUID_RE.test(kunjunganId);

  const [active, setActive] = useState<SubTab>("fisik");

  // Meta: waktu (DateTimePicker) + dokter (roster Select) + perawat (sesi login, read-only).
  const [waktu, setWaktu]   = useState<string>(() => nowLocalDT());
  const [dokter, setDokter] = useState<string>("");
  const [formState, setFormState] = useState<PemeriksaanFormState>(() => emptyFormState());
  const [formKey, setFormKey] = useState("new"); // remount StatusFisikPane saat prefill datang

  // Roster dokter ter-assign ruangan kunjungan (konsumen klinis — sama pola Informed Consent).
  const [dokterRoster, setDokterRoster] = useState<string[]>([]);

  const perawat = session?.namaTampil ?? "";

  // Muat pemeriksaan terbaru (prefill) + roster dokter (kunjungan UUID).
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getPemeriksaanFisik(kunjunganId, ac.signal)
      .then((rows) => {
        if (rows.length === 0) return;
        const latest = rows[0]; // GET terurut terbaru dulu
        setFormState(dtoToFormState(latest));
        setWaktu(isoToLocalDT(latest.waktuPemeriksaan));
        setDokter(latest.dokter);
        setFormKey(latest.id);
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat pemeriksaan fisik", e instanceof ApiError ? e.message : undefined);
      });
    listPetugasKunjungan(kunjunganId, "Dokter", ac.signal)
      .then((items) => setDokterRoster(items.map((p) => p.namaTampil)))
      .catch(() => { /* 403/belum login → fallback DPJP header */ });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  // Opsi dokter = roster + DPJP header (dokterFallback) + nilai tersimpan (record lama).
  const dokterOptions = useMemo(() => {
    const set = new Set(dokterRoster);
    if (dokterFallback && dokterFallback !== "—") set.add(dokterFallback);
    if (dokter) set.add(dokter);
    return [...set].sort((a, b) => a.localeCompare(b, "id"));
  }, [dokterRoster, dokterFallback, dokter]);

  async function handleSave(data: PemeriksaanFormState) {
    // Meta (waktu/dokter/perawat) menang atas salinan form (anti-stale).
    const merged: PemeriksaanFormState = {
      ...data, tanggal: dtDate(waktu), jam: dtTime(waktu), dokter, perawat,
    };
    if (!isPersisted) { setFormState(merged); toast.info("Pasien demo — pemeriksaan tidak tersimpan ke database"); return; }
    try {
      const dto = await createPemeriksaanFisik(kunjunganId, {
        waktuPemeriksaan: localToIso(waktu),
        dokterPemeriksa: dokter || undefined,
        perawat: perawat || undefined,
        ku: data.ku, kesadaran: data.kesadaran, gizi: data.gizi,
        mobilitas: data.mobilitas,
        orientasi: data.orientasi,
        catatanGeneralis: data.catatanGeneralis || undefined,
        sistem: data.sistem,
        temuanAbnormal: data.temuanAbnormal,
        temuanLain: data.temuanLain,
        catatanUmum: data.catatanUmum || undefined,
        bodyMarkings: data.bodyMarkings,
      });
      setFormState(dtoToFormState(dto));
      setWaktu(isoToLocalDT(dto.waktuPemeriksaan));
      setDokter(dto.dokter);
      setFormKey(dto.id);
      toast.success("Pemeriksaan fisik tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan pemeriksaan", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Top bar */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <Activity size={16} className="text-indigo-500" />
        <span className="text-sm font-semibold text-slate-700">Pemeriksaan Fisik</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-400">Head-to-toe · SNARS AP 1</span>
      </div>

      {/* Metadata header */}
      <MetaHeader
        waktu={waktu}
        dokter={dokter}
        perawat={perawat}
        dokterOptions={dokterOptions}
        onWaktu={setWaktu}
        onDokter={setDokter}
      />

      {/* Sub-tab nav */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex overflow-x-auto">
          {SUB_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={cn(
                "relative flex shrink-0 cursor-pointer items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors",
                active === id ? "text-indigo-700" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Icon size={13} aria-hidden />
              {label}
              {active === id && (
                <motion.div
                  layoutId="pemeriksaan-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {active === "fisik" && (
            <StatusFisikPane
              key={formKey}
              initial={formState}
              onSave={handleSave}
            />
          )}
          {active === "anatomi"   && <AnatomiPane kunjunganId={kunjunganId} isPersisted={isPersisted} />}
          {active === "penunjang" && <PenunjangPane kunjunganId={kunjunganId} isPersisted={isPersisted} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
