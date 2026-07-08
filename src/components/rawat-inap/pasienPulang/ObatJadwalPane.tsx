"use client";

// Sub-pane "Obat & Jadwal" — tab Pasien Pulang RI.
//  · Obat Pulang = ORDER NYATA ke Farmasi (POST /kunjungan/:id/resep, flag `isObatPulang`)
//    → muncul di worklist Farmasi ber-badge "Obat Pulang"; katalog dari formularium
//    (/master/obat-tersedia) + depo tujuan dari master (/master/lokasi-farmasi).
//  · Jadwal Kontrol = DOMAIN PERSIST (medicalrecord.JadwalKontrol): nomor auto sistem
//    (JK-<YYMM><NNN>) + pasien BPJS → server panggil V-Claim RencanaKontrol/insert →
//    No. Referensi = noSuratKontrol response; kodeDokter TIDAK ada di form (resolve server
//    dari bpjs.DpjpMapping via dokter terpilih, embed ke payload); preview payload tersedia.
//  · Semua kontrol pakai komponen global (Select/DatePicker) — tanpa <select>/<input date> native.
//  · Rujukan FKTP & Jadwal Pemeriksaan Lanjutan DIHAPUS dari pane ini.
//    Pasien demo (non-UUID) = daftar lokal.

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, CalendarCheck, CheckCircle2, Clock,
  Minus, Pill, Plus, Search, Send, ShieldCheck, Trash2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/contexts/SessionContext";
import { Select } from "@/components/shared/inputs";
import { listObatTersedia, type ObatTersediaDTO } from "@/lib/api/master/obatTersedia";
import { listLokasiFarmasi, type LokasiFarmasi } from "@/lib/api/master/lokasiFarmasi";
import { createResep, listResep, cancelResep, type ResepOrderDTO } from "@/lib/api/resep/resep";
import JadwalKontrolSection from "@/components/shared/medical-records/jadwalKontrol/JadwalKontrolSection";
import type { RawatInapPatientDetail } from "@/lib/data";
import {
  type ObatPulangItem, type PasienPulangData,
} from "./pasienPulangShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SIGNA_OPTIONS = ["1 × 1", "2 × 1", "3 × 1", "4 × 1", "1 × 2", "Bila perlu (PRN)"];

type Props = {
  data:     PasienPulangData;
  onChange: (d: PasienPulangData) => void;
  patient:  RawatInapPatientDetail;
};

// ── UI helpers ────────────────────────────────────────────

function SectionTitle({
  icon: Icon, label, count, hint,
}: { icon: IconComponent; label: string; count?: number; hint?: string }) {
  return (
    <div className="mb-3 border-b border-slate-100 pb-2">
      <div className="flex items-center gap-2">
        <Icon size={12} className="text-orange-400" />
        <p className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        {count !== undefined && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{count}</span>
        )}
      </div>
      {hint && <p className="mt-1 text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
      {label}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </label>
  );
}

/** Stepper angka kecil (jumlah / durasi hari). */
function Stepper({
  value, onChange, min = 1, max = 999, suffix,
}: { value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string }) {
  return (
    <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-full w-7 items-center justify-center text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
      >
        <Minus size={11} />
      </button>
      <span className="min-w-9 px-1 text-center text-xs font-semibold text-slate-700">
        {value}{suffix && <span className="ml-0.5 font-normal text-slate-400">{suffix}</span>}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-full w-7 items-center justify-center text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
      >
        <Plus size={11} />
      </button>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-orange-300 focus:ring-1 focus:ring-orange-100";

// ── Obat Pulang — order ke Farmasi ────────────────────────

interface DraftObat {
  kode:       string;
  nama:       string;
  detail:     string;  // "500 mg · Tablet"
  jumlah:     number;
  signa:      string;
  durasiHari: number;
  instruksi:  string;
  isHAM:      boolean;
  harga:      number | null;
  bzaKode?:   string;
  kategori:   "Reguler" | "Narkotika" | "Psikotropika";
}

const RESEP_STATUS_CHIP: Record<string, string> = {
  Menunggu:          "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  Diterima:          "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  Ditelaah:          "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  "Siap Diserahkan": "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  Selesai:           "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  Dibatalkan:        "bg-rose-100 text-rose-600 ring-1 ring-rose-200",
};

/** Latar kartu order by status: kuning = berjalan · merah = dibatalkan · hijau = selesai. */
function orderCardCls(status: string): string {
  if (status === "Dibatalkan") return "border-rose-200 bg-rose-50";
  if (status === "Selesai")    return "border-emerald-200 bg-emerald-50";
  return "border-amber-200 bg-amber-50";
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function golonganToKategori(golongan: string | null): DraftObat["kategori"] {
  if (!golongan) return "Reguler";
  if (golongan.toLowerCase().includes("narkotika")) return "Narkotika";
  if (golongan.toLowerCase().includes("psikotropika")) return "Psikotropika";
  return "Reguler";
}

function ObatPulangSection({
  isPersisted, kunjunganId, localItems, onLocalChange,
}: {
  isPersisted:   boolean;
  kunjunganId:   string;
  localItems:    ObatPulangItem[];
  onLocalChange: (items: ObatPulangItem[]) => void;
}) {
  // Master data (persisted): katalog formularium + depo Farmasi.
  const [katalog, setKatalog] = useState<ObatTersediaDTO[] | null>(null);
  const [depoList, setDepoList] = useState<LokasiFarmasi[]>([]);
  const [depoKode, setDepoKode] = useState("");

  // Order flow state.
  const [query, setQuery]     = useState("");
  const [draft, setDraft]     = useState<DraftObat | null>(null);
  const [drafts, setDrafts]   = useState<DraftObat[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState<ResepOrderDTO[]>([]);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null); // konfirmasi inline
  const [cancelingId, setCancelingId]         = useState<string | null>(null);

  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    listObatTersedia({}, ac.signal).then(setKatalog).catch(() => setKatalog([]));
    listLokasiFarmasi(ac.signal).then(setDepoList).catch(() => {});
    listResep(kunjunganId, ac.signal)
      .then((rows) => setSent(rows.filter((o) => o.isObatPulang)))
      .catch(() => {});
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || !katalog) return [];
    return katalog
      .filter((o) =>
        o.namaGenerik.toLowerCase().includes(q) ||
        o.namaDagang.toLowerCase().includes(q) ||
        o.kode.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, katalog]);

  // Nama generik = nama utama (konvensi katalog/Register N/P); dagang = keterangan.
  function pickObat(o: ObatTersediaDTO) {
    const beda = o.namaDagang && o.namaDagang !== o.namaGenerik;
    setDraft({
      kode: o.kode,
      nama: o.namaGenerik || o.namaDagang,
      detail: [o.kekuatan, o.bentuk, beda ? `(${o.namaDagang})` : ""].filter(Boolean).join(" · "),
      jumlah: 10, signa: "", durasiHari: 5, instruksi: "",
      isHAM: o.isHAM,
      harga: o.hargaSatuan,
      bzaKode: o.bza[0]?.kode,
      kategori: golonganToKategori(o.golongan),
    });
    setQuery("");
  }

  function pickManual() {
    const nama = query.trim();
    if (!nama) return;
    setDraft({
      kode: "", nama, detail: "", jumlah: 10, signa: "", durasiHari: 5,
      instruksi: "", isHAM: false, harga: null, kategori: "Reguler",
    });
    setQuery("");
  }

  function addDraft() {
    if (!draft || !draft.signa) return;
    if (isPersisted) {
      setDrafts((d) => [...d, draft]);
    } else {
      onLocalChange([...localItems, {
        id: `op-${Date.now()}`,
        namaObat: draft.nama,
        dosis: draft.detail || "—",
        frekuensi: draft.signa,
        durasi: `${draft.durasiHari} hari`,
        instruksi: draft.instruksi,
        isHAM: draft.isHAM,
        fromResep: false,
      }]);
    }
    setDraft(null);
  }

  async function kirimKeFarmasi() {
    if (drafts.length === 0 || !depoKode || sending) return;
    const depo = depoList.find((d) => d.kode === depoKode);
    if (!depo) return;
    setSending(true);
    try {
      await createResep(kunjunganId, {
        depoKode: depo.kode,
        depoNama: depo.nama,
        prioritas: "Rutin",
        isObatPulang: true,
        catatan: "Obat pulang (discharge) — disiapkan untuk dibawa pulang pasien",
        items: drafts.map((d) => ({
          kodeObat: d.kode,
          namaObat: d.nama,
          bzaKode: d.bzaKode,
          dosis: d.detail || undefined,
          signa: d.signa,
          jumlah: d.jumlah,
          durasiHari: d.durasiHari,
          keterangan: d.instruksi || undefined,
          kategori: d.kategori,
          isHAM: d.isHAM,
          harga: d.harga,
        })),
      });
      setDrafts([]);
      const rows = await listResep(kunjunganId);
      setSent(rows.filter((o) => o.isObatPulang));
      toast.success("Order obat pulang terkirim ke Farmasi", `${depo.nama} · penanda "Obat Pulang"`);
    } catch (e) {
      toast.error("Gagal mengirim order obat pulang", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSending(false);
    }
  }

  /** Batalkan order obat pulang (Dokter; backend tolak selain status "Menunggu"). */
  async function batalkanOrder(id: string) {
    if (cancelingId) return;
    setCancelingId(id);
    try {
      await cancelResep(kunjunganId, id);
      const rows = await listResep(kunjunganId);
      setSent(rows.filter((o) => o.isObatPulang));
      toast.success("Order obat pulang dibatalkan");
    } catch (e) {
      toast.error("Gagal membatalkan order", e instanceof ApiError ? e.message : undefined);
    } finally {
      setCancelingId(null);
      setConfirmCancelId(null);
    }
  }

  const totalHarga = drafts.reduce((s, d) => s + (d.harga ?? 0) * d.jumlah, 0);
  const adaHAM = drafts.some((d) => d.isHAM) || (!isPersisted && localItems.some((i) => i.isHAM));

  return (
    <div className="space-y-3">

      {/* Depo tujuan (persisted) */}
      {isPersisted && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <FieldLabel label="Depo Farmasi Tujuan" required />
            <Select
              value={depoKode}
              onChange={setDepoKode}
              options={depoList.map((d) => ({ value: d.kode, label: d.nama }))}
              placeholder="Pilih depo tujuan…"
            />
          </div>
          <div className="flex items-end">
            <p className="rounded-lg bg-orange-50 px-2.5 py-2 text-[10px] leading-snug text-orange-700 ring-1 ring-orange-100">
              Order masuk worklist Farmasi dengan penanda <span className="font-bold">Obat Pulang</span>.
            </p>
          </div>
        </div>
      )}

      {/* Cari obat */}
      <div className="relative">
        <FieldLabel label="Cari Obat (formularium)" />
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (suggestions[0]) pickObat(suggestions[0]);
              else pickManual();
            }}
            placeholder="Ketik min. 2 huruf — nama generik / dagang / kode…"
            className={cn(inputCls, "pl-8")}
          />
        </div>
        {query.trim().length >= 2 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {suggestions.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => pickObat(o)}
                className="flex w-full items-center gap-2 border-b border-slate-50 px-3 py-2 text-left transition hover:bg-orange-50"
              >
                <Pill size={12} className="shrink-0 text-orange-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-slate-700">
                    {o.namaGenerik || o.namaDagang}
                  </span>
                  <span className="block truncate text-[10px] text-slate-400">
                    {[o.kekuatan, o.bentuk, o.namaDagang && o.namaDagang !== o.namaGenerik ? o.namaDagang : ""].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {o.isHAM && <span className="shrink-0 rounded bg-rose-600 px-1 py-0.5 text-[8px] font-black uppercase text-white">HAM</span>}
                {o.hargaSatuan != null && (
                  <span className="shrink-0 text-[10px] font-semibold text-slate-500">{rupiah(o.hargaSatuan)}</span>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={pickManual}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-slate-500 transition hover:bg-slate-50"
            >
              <Plus size={11} className="shrink-0" />
              Gunakan &ldquo;{query.trim()}&rdquo; (tulis manual, di luar katalog)
            </button>
          </div>
        )}
      </div>

      {/* Editor item terpilih */}
      <AnimatePresence>
        {draft && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="rounded-xl border border-orange-200 bg-orange-50/70 p-3"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-800">{draft.nama}</p>
                  {draft.isHAM && <span className="rounded bg-rose-600 px-1 py-0.5 text-[8px] font-black uppercase text-white">HAM</span>}
                </div>
                {draft.detail && <p className="text-[10px] text-slate-500">{draft.detail}</p>}
              </div>
              <button onClick={() => setDraft(null)} className="shrink-0 text-slate-400 hover:text-slate-600"><X size={13} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <FieldLabel label="Signa / Frekuensi" required />
                <Select
                  value={draft.signa}
                  onChange={(v) => setDraft((d) => d && { ...d, signa: v })}
                  options={SIGNA_OPTIONS}
                  placeholder="Pilih…"
                />
              </div>
              <div>
                <FieldLabel label="Jumlah" />
                <Stepper value={draft.jumlah} onChange={(v) => setDraft((d) => d && { ...d, jumlah: v })} max={999} />
              </div>
              <div>
                <FieldLabel label="Durasi" />
                <Stepper value={draft.durasiHari} onChange={(v) => setDraft((d) => d && { ...d, durasiHari: v })} max={90} suffix=" hr" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <FieldLabel label="Instruksi" />
                <input
                  value={draft.instruksi}
                  onChange={(e) => setDraft((d) => d && { ...d, instruksi: e.target.value })}
                  placeholder="Sesudah makan…"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              {draft.harga != null ? (
                <p className="text-[10px] text-slate-500">
                  Estimasi: <span className="font-semibold text-slate-700">{rupiah(draft.harga * draft.jumlah)}</span>
                </p>
              ) : <span />}
              <button
                type="button"
                onClick={addDraft}
                disabled={!draft.signa}
                className="rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Tambah ke Daftar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daftar draft (persisted) / daftar lokal (demo) */}
      <div className="space-y-2">
        {(isPersisted ? drafts.length === 0 : localItems.length === 0) && !draft && (
          <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-[11px] text-slate-400">
            Belum ada obat pulang — cari obat di atas untuk menambahkan
          </p>
        )}
        <AnimatePresence>
          {isPersisted
            ? drafts.map((d, i) => (
              <motion.div
                key={`${d.nama}-${i}`}
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <Pill size={12} className="mt-0.5 shrink-0 text-orange-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-[12px] font-semibold text-slate-700">{d.nama}</p>
                    {d.isHAM && <span className="rounded bg-rose-600 px-1 py-0.5 text-[8px] font-black uppercase text-white">HAM</span>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {[d.detail, d.signa, `${d.jumlah} pcs`, `${d.durasiHari} hari`].filter(Boolean).join(" · ")}
                  </p>
                  {d.instruksi && <p className="mt-0.5 text-[10px] italic text-slate-400">{d.instruksi}</p>}
                </div>
                {d.harga != null && (
                  <span className="shrink-0 text-[10px] font-semibold text-slate-500">{rupiah(d.harga * d.jumlah)}</span>
                )}
                <button
                  onClick={() => setDrafts((arr) => arr.filter((_, idx) => idx !== i))}
                  className="shrink-0 rounded-lg p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))
            : localItems.map((ob) => (
              <motion.div
                key={ob.id}
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <Pill size={12} className="mt-0.5 shrink-0 text-orange-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-[12px] font-semibold text-slate-700">{ob.namaObat}</p>
                    {ob.isHAM && <span className="rounded bg-rose-600 px-1 py-0.5 text-[8px] font-black uppercase text-white">HAM</span>}
                    {ob.fromResep && <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[8px] font-semibold text-sky-600">dari Resep</span>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{ob.dosis} · {ob.frekuensi} · {ob.durasi}</p>
                  {ob.instruksi && <p className="mt-1 text-[10px] text-slate-400">{ob.instruksi}</p>}
                </div>
                <button
                  onClick={() => onLocalChange(localItems.filter((i) => i.id !== ob.id))}
                  className="shrink-0 rounded-lg p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {adaHAM && (
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <AlertTriangle size={11} className="shrink-0 text-red-500" />
          <p className="text-[10px] text-red-700">Terdapat obat High-Alert. Pastikan double-check dan edukasi khusus sudah diberikan.</p>
        </div>
      )}

      {/* Kirim ke Farmasi */}
      {isPersisted && drafts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2.5">
          <p className="text-[11px] text-slate-500">
            <span className="font-bold text-slate-700">{drafts.length} obat</span>
            {totalHarga > 0 && <> · est. <span className="font-semibold text-slate-700">{rupiah(totalHarga)}</span></>}
          </p>
          <button
            type="button"
            onClick={() => void kirimKeFarmasi()}
            disabled={!depoKode || sending}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={12} />
            {sending ? "Mengirim…" : !depoKode ? "Pilih depo dulu" : "Kirim ke Farmasi"}
          </button>
        </div>
      )}

      {/* Order terkirim — latar by status: kuning = berjalan · merah = dibatalkan · hijau = selesai */}
      {isPersisted && sent.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Obat Pulang Terkirim</p>
          {sent.map((o) => {
            const batal = o.status === "Dibatalkan";
            const selesai = o.status === "Selesai";
            return (
              <div key={o.id} className={cn("rounded-xl border p-3 shadow-xs transition-colors", orderCardCls(o.status))}>
                <div className="flex flex-wrap items-center gap-1.5">
                  {batal
                    ? <X size={12} className="text-rose-500" />
                    : <CheckCircle2 size={12} className={selesai ? "text-emerald-500" : "text-amber-500"} />}
                  <span className="text-[11px] font-semibold text-slate-700">{o.depoNama}</span>
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[8px] font-bold text-orange-700 ring-1 ring-orange-200">Obat Pulang</span>
                  <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold", RESEP_STATUS_CHIP[o.status] ?? RESEP_STATUS_CHIP.Menunggu)}>
                    {o.status}
                  </span>
                </div>
                <p className={cn("mt-1 text-[11px]", batal ? "text-rose-400 line-through" : "text-slate-500")}>
                  {o.items.map((i) => i.namaObat).join(", ")}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={9} /> {o.createdAt.slice(0, 10)} {o.createdAt.slice(11, 16)} · {o.items.length} item · {o.penulis}
                  </p>
                  {/* Batalkan — hanya sebelum diterima Farmasi (status Menunggu; backend menegakkan) */}
                  {o.status === "Menunggu" && (
                    confirmCancelId === o.id ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-rose-600">Batalkan order ini?</span>
                        <button
                          type="button"
                          onClick={() => void batalkanOrder(o.id)}
                          disabled={cancelingId === o.id}
                          className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-bold text-white transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                        >
                          {cancelingId === o.id ? "Membatalkan…" : "Ya, Batalkan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmCancelId(null)}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:bg-slate-50"
                        >
                          Tidak
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelId(o.id)}
                        className="flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95"
                      >
                        <X size={10} /> Batalkan
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function ObatJadwalPane({ data, onChange, patient }: Props) {
  const isPersisted = UUID_RE.test(patient.id);
  const isBpjs = patient.penjamin.startsWith("BPJS");
  const { session } = useSession();
  const [kontrolCount, setKontrolCount] = useState(0); // dari server (persisted)
  const jumlahKontrol = isPersisted ? kontrolCount : data.jadwalKontrol.length;

  function set<K extends keyof PasienPulangData>(key: K, val: PasienPulangData[K]) {
    onChange({ ...data, [key]: val });
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row">

      {/* ── Left: Obat + Jadwal ── */}
      <div className="min-w-0 flex-1 space-y-4">

        {/* Obat Pulang → Farmasi */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle
            icon={Pill}
            label="Obat Pulang — Order ke Farmasi"
            count={isPersisted ? undefined : data.obatPulang.length}
            hint={isPersisted
              ? "Obat dicari dari formularium; order terkirim ke depo Farmasi dengan penanda khusus Obat Pulang."
              : "Pasien demo — daftar tersimpan lokal (tidak terkirim ke Farmasi)."}
          />
          <ObatPulangSection
            isPersisted={isPersisted}
            kunjunganId={patient.id}
            localItems={data.obatPulang}
            onLocalChange={(items) => set("obatPulang", items)}
          />
        </div>

        {/* Jadwal Kontrol */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle
            icon={CalendarCheck}
            label="Jadwal Kontrol Poliklinik"
            count={jumlahKontrol}
            hint={isBpjs
              ? "Pasien BPJS — nomor auto sistem; No. Referensi (noSuratKontrol) diterima dari V-Claim RencanaKontrol/insert saat disimpan."
              : "Nomor surat kontrol digenerate otomatis oleh sistem saat disimpan."}
          />
          <JadwalKontrolSection
            isPersisted={isPersisted}
            kunjunganId={patient.id}
            items={data.jadwalKontrol}
            onChange={(items) => set("jadwalKontrol", items)}
            isBpjs={isBpjs}
            userNama={session?.namaTampil ?? ""}
            onCountChange={setKontrolCount}
          />
        </div>

      </div>

      {/* ── Right: Summary ── */}
      <div className="w-full shrink-0 space-y-3 xl:w-64">

        {/* Penjamin */}
        <div className={cn(
          "rounded-xl border p-4 shadow-sm",
          isBpjs ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white",
        )}>
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className={isBpjs ? "text-emerald-600" : "text-slate-400"} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Penjamin</p>
          </div>
          <p className={cn("mt-1.5 text-sm font-bold", isBpjs ? "text-emerald-700" : "text-slate-700")}>
            {patient.penjamin.replace(/_/g, " ")}
          </p>
          {isBpjs && (
            <p className="mt-1 text-[10px] leading-snug text-emerald-700">
              Jadwal kontrol diterbitkan via <span className="font-semibold">RencanaKontrol/insert</span> — No. SEP + dokter ter-map + poli + tanggal; No. Referensi diterima dari BPJS.
            </p>
          )}
        </div>

        {/* Ringkasan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ringkasan</p>
          <div className="space-y-2">
            {[
              { icon: Pill,          label: "Obat pulang",    val: isPersisted ? undefined : data.obatPulang.length },
              { icon: CalendarCheck, label: "Jadwal kontrol", val: jumlahKontrol },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={10} className="text-slate-400" />
                  <p className="text-[11px] text-slate-500">{label}</p>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  val === undefined
                    ? "bg-orange-100 text-orange-600"
                    : val > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
                )}>
                  {val === undefined ? "via Farmasi" : val}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
