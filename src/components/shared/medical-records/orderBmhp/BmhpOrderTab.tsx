"use client";

// Tab Order BMHP (shared IGD/RI/RJ) — permintaan Bahan Medis Habis Pakai ke depo Farmasi.
// Adopsi pendekatan Resep Pasien: header pemohon + form tambah item (kiri) + daftar order (kanan)
// + riwayat order. Katalog = BMHP ter-assign ke depo Farmasi (GET /master/bmhp-tersedia, kode BHP-…
// saja). Yang boleh order = Dokter & Perawat (gate clinical.tindakan:create; server tetap penjaga).
// Submit saat kunjunganId UUID → POST /kunjungan/:id/bmhp; pasien demo → sukses lokal.

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search, Trash2, Package, User, Building2, Calendar, FileText,
  CheckCircle2, AlertCircle, Loader2, Zap, ShieldCheck, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs/Select";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";
import { listLokasiFarmasi, type LokasiFarmasi } from "@/lib/api/master/lokasiFarmasi";
import { listBmhpTersedia } from "@/lib/api/master/bmhpTersedia";
import { createBmhpOrder, type BmhpOrderDTO } from "@/lib/api/bmhpOrder/bmhpOrder";
import { listStokKlinis, type StokKlinisRow } from "@/lib/api/inventory/stock";
import {
  KUNJUNGAN_UUID_RE, bmhpTersediaToCatalog, genBmhpItemId, formatRp,
  applyStokBmhp, STOK_TEXT, stokLabel,
  type BmhpOrderPatient, type BmhpCatalog, type BmhpDraftItem,
} from "./bmhpOrderShared";
import RiwayatOrderBmhp from "./RiwayatOrderBmhp";

const PRIORITAS = ["Rutin", "Segera", "CITO"] as const;
type Prioritas = (typeof PRIORITAS)[number];

const DEPO_FALLBACK = ["Depo IGD", "Depo Rawat Inap", "Apotek Rawat Jalan", "Gudang Farmasi"];

// ── Search BMHP ───────────────────────────────────────────

function BmhpSearch({
  onSelect, catalog, loading,
}: {
  onSelect: (b: BmhpCatalog) => void;
  catalog: BmhpCatalog[];
  loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<BmhpCatalog[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    const ql = q.toLowerCase();
    const filtered = catalog
      .filter((b) => b.nama.toLowerCase().includes(ql) || b.kode.toLowerCase().includes(ql) || (b.merek ?? "").toLowerCase().includes(ql))
      .slice(0, 8);
    setResults(filtered);
    setOpen(filtered.length > 0);
  };

  const pick = (b: BmhpCatalog) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect(b);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
          placeholder={loading ? "Memuat katalog BMHP…" : "Ketik nama BMHP atau kode BHP-…"}
          disabled={loading}
          className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
        />
        {loading && <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((b) => (
            <button
              key={b.kode}
              type="button"
              onClick={() => pick(b)}
              className="flex w-full items-center justify-between gap-3 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {b.nama}{b.ukuran ? <span className="font-normal text-slate-500"> · {b.ukuran}</span> : null}
                </p>
                <p className="text-[11px] text-slate-400">{b.kode} · {b.kategori}{b.merek ? ` · ${b.merek}` : ""}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                {b.isSteril && <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-teal-700">Steril</span>}
                <span className="text-[10px] font-medium text-slate-500">
                  {b.harga ? formatRp(b.harga) : "—"}<span className="text-slate-400">/{b.satuan}</span>
                </span>
                {b.stokStatus && (
                  <span className={cn("text-[10px] font-semibold", STOK_TEXT[b.stokStatus])}>
                    {stokLabel(b.stokStatus, b.stok ?? 0)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Draft item row ────────────────────────────────────────

function ItemRow({
  item, index, onChange, onRemove, stok,
}: {
  item: BmhpDraftItem;
  index: number;
  onChange: (it: BmhpDraftItem) => void;
  onRemove: () => void;
  /** Saldo depo terpilih (advisory) — badge stok + peringatan bila jumlah melebihi tersedia. */
  stok?: StokKlinisRow;
}) {
  const subtotal = (item.harga ?? 0) * item.jumlah;
  const melebihi = stok && stok.status !== "Habis" && item.jumlah > stok.available;
  return (
    <div
      className="animate-fade-in rounded-xl border border-slate-200 bg-white p-3 shadow-xs"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          <Package size={13} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800">{item.nama}</p>
          <p className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-400">
            <span>{item.kode}{item.kategori ? ` · ${item.kategori}` : ""}</span>
            {stok?.status && (
              <span className={cn("font-semibold", STOK_TEXT[stok.status])}>· {stokLabel(stok.status, stok.available)}</span>
            )}
          </p>
          {melebihi && (
            <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-amber-600">
              <AlertCircle size={10} /> Jumlah melebihi stok tersedia ({stok!.available})
            </p>
          )}
          <input
            value={item.keterangan}
            onChange={(e) => onChange({ ...item, keterangan: e.target.value })}
            placeholder="Keterangan (opsional)…"
            className="mt-1.5 h-7 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200"
          />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              value={item.jumlah}
              onChange={(e) => onChange({ ...item, jumlah: Math.max(1, Number(e.target.value) || 1) })}
              className="h-7 w-14 rounded-lg border border-slate-200 bg-white px-2 text-right text-xs font-semibold text-slate-800 outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200"
            />
            <span className="w-9 text-[10px] text-slate-400">{item.satuan}</span>
            <button
              onClick={onRemove}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
              aria-label="Hapus BMHP"
            >
              <Trash2 size={11} />
            </button>
          </div>
          {subtotal > 0 && <span className="text-[11px] font-medium text-slate-500">{formatRp(subtotal)}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function BmhpOrderTab({ patient }: { patient: BmhpOrderPatient }) {
  const { session, can } = useSession();
  // Order BMHP boleh Dokter & Perawat → gate UI = clinical.tindakan:create (server tetap penjaga).
  const canOrder = can("clinical.tindakan", "create");

  const [items, setItems] = useState<BmhpDraftItem[]>([]);
  const [depo, setDepo] = useState<string>(patient.unitLabel === "IGD" ? "Depo IGD" : DEPO_FALLBACK[0]);
  const [prioritas, setPrioritas] = useState<Prioritas>("Rutin");
  const [catatan, setCatatan] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useState<{ count: number; depo: string } | null>(null);
  const [riwayatKey, setRiwayatKey] = useState(0);

  const [lokasiFarmasi, setLokasiFarmasi] = useState<LokasiFarmasi[]>([]);
  const [katalog, setKatalog] = useState<BmhpCatalog[]>([]);
  const [katalogLoading, setKatalogLoading] = useState(true);

  const pemohon = session?.namaTampil?.trim() || patient.dpjp;
  const dpjpKontak = patient.dpjpKontak?.trim() || "-";

  // Depo tujuan = Ruangan kategori Farmasi (master); fallback DEPO_FALLBACK bila kosong/gagal.
  useEffect(() => {
    const ac = new AbortController();
    listLokasiFarmasi(ac.signal)
      .then((rows) => {
        if (ac.signal.aborted || rows.length === 0) return;
        setLokasiFarmasi(rows);
        setDepo((prev) => (rows.some((l) => l.nama === prev) ? prev : rows[0].nama));
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  // Katalog BMHP = BMHP ter-assign ke depo Farmasi (Ketersediaan Farmasi · sub BMHP), kode BHP-… saja.
  useEffect(() => {
    const ac = new AbortController();
    listBmhpTersedia({}, ac.signal)
      .then((rows) => { if (!ac.signal.aborted) setKatalog(rows.map(bmhpTersediaToCatalog)); })
      .catch(() => {})
      .finally(() => { if (!ac.signal.aborted) setKatalogLoading(false); });
    return () => ac.abort();
  }, []);

  const depoOptions = lokasiFarmasi.length ? lokasiFarmasi.map((l) => l.nama) : DEPO_FALLBACK;
  const total = useMemo(() => items.reduce((s, it) => s + (it.harga ?? 0) * it.jumlah, 0), [items]);

  // Overlay stok ADVISORY: saldo BMHP di depo terpilih (tidak memfilter/menggagalkan order).
  // Penjaga stok sesungguhnya ada di dispensing Farmasi (movement OUT anti-negatif).
  const depoId = useMemo(() => lokasiFarmasi.find((l) => l.nama === depo)?.id ?? null, [lokasiFarmasi, depo]);
  const [stokDepo, setStokDepo] = useState<{ depoId: string; map: Map<string, StokKlinisRow> } | null>(null);
  useEffect(() => {
    if (!depoId) return;
    const ac = new AbortController();
    listStokKlinis(depoId, "BMHP", ac.signal)
      .then((rows) => { if (!ac.signal.aborted) setStokDepo({ depoId, map: new Map(rows.map((r) => [r.itemId, r])) }); })
      .catch(() => {}); // diam — stok hanya advisory, kegagalan tak menghalangi order
    return () => ac.abort();
  }, [depoId]);
  const stokMap = useMemo(
    () => (depoId && stokDepo?.depoId === depoId ? stokDepo.map : new Map<string, StokKlinisRow>()),
    [depoId, stokDepo],
  );
  const katalogStok = useMemo(() => applyStokBmhp(katalog, stokMap), [katalog, stokMap]);

  const addItem = (b: BmhpCatalog) => {
    setItems((prev) => {
      // Item sama (kode) → tambah jumlah, jangan duplikat baris.
      const idx = prev.findIndex((it) => it.kode === b.kode && it.nama === b.nama);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], jumlah: next[idx].jumlah + 1 };
        return next;
      }
      return [...prev, {
        id: genBmhpItemId(),
        bmhpId: b.id,
        kode: b.kode,
        nama: b.nama,
        satuan: b.satuan,
        kategori: b.kategori,
        jumlah: 1,
        keterangan: "",
        harga: b.harga,
      }];
    });
  };

  const updateItem = (it: BmhpDraftItem) => setItems((prev) => prev.map((x) => (x.id === it.id ? it : x)));
  const removeItem = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));
  const removeAll = () => setItems([]);

  const copyOrderToForm = (o: BmhpOrderDTO) => {
    const ts = Date.now();
    setItems((prev) => [
      ...prev,
      ...o.items.map((it, i) => ({
        id: `bhp-${ts}-${i}`,
        bmhpId: it.bmhpId ?? undefined,
        kode: it.kode,
        nama: it.nama,
        satuan: it.satuan,
        kategori: it.kategori,
        jumlah: it.jumlah,
        keterangan: it.keterangan ?? "",
        harga: it.harga ?? undefined,
      })),
    ]);
    toast.success("Disalin ke order", `${o.items.length} item dari ${o.depoNama}`);
  };

  const submitOrder = async () => {
    if (items.length === 0 || !canOrder || sending) return;
    const count = items.length;
    if (KUNJUNGAN_UUID_RE.test(patient.id)) {
      setSending(true);
      try {
        await createBmhpOrder(patient.id, {
          depoKode: lokasiFarmasi.find((l) => l.nama === depo)?.kode,
          depoNama: depo,
          catatan: catatan || undefined,
          prioritas,
          penulis: pemohon,
          penulisKontak: dpjpKontak === "-" ? undefined : dpjpKontak,
          items: items.map((it) => ({
            bmhpId: it.bmhpId,
            kode: it.kode,
            nama: it.nama,
            satuan: it.satuan,
            kategori: it.kategori,
            jumlah: it.jumlah,
            keterangan: it.keterangan || undefined,
            harga: it.harga ?? undefined,
          })),
        });
      } catch {
        setSending(false);
        return; // gagal → pertahankan form (boundary error sudah toast di api client)
      }
      setSending(false);
      setRiwayatKey((k) => k + 1);
    }
    setLastOrderInfo({ count, depo });
    setSubmitted(true);
    removeAll();
    setCatatan("");
  };

  // ── Success screen ─────────────────────────────────────
  if (submitted && lastOrderInfo) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={28} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-700">Order BMHP Terkirim</p>
          <p className="mt-1 text-xs text-slate-500">
            {lastOrderInfo.count} item dikirim ke{" "}
            <span className="font-semibold text-slate-700">{lastOrderInfo.depo}</span>
          </p>
        </div>
        <button
          onClick={() => { setSubmitted(false); setLastOrderInfo(null); }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Buat Order Baru
        </button>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <User size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pemohon</p>
              <p className="text-xs font-semibold text-slate-800">{pemohon}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400"><Phone size={10} className="shrink-0" />{dpjpKontak}</p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <FileText size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pasien</p>
              <p className="text-xs font-semibold text-slate-800">{patient.name}</p>
              <p className="text-[11px] text-slate-400">
                {patient.noRM}{patient.age != null ? ` · ${patient.age} thn` : ""}
                {patient.gender ? ` · ${patient.gender === "L" ? "Laki-laki" : "Perempuan"}` : ""}
              </p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 size={14} />
            </span>
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Depo Farmasi</p>
              <Select value={depo} onChange={setDepo} options={depoOptions} className="h-7 min-w-40 py-0" />
            </div>
          </div>

          {patient.tglKunjungan && (
            <>
              <div className="hidden h-7 w-px bg-slate-100 sm:block" />
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Calendar size={14} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal</p>
                  <p className="text-xs font-semibold text-slate-800">{patient.tglKunjungan}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: form */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-slate-700">Tambah BMHP ke Order</p>
            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cari BMHP <span className="text-rose-400">*</span></p>
                <BmhpSearch onSelect={addItem} catalog={katalogStok} loading={katalogLoading} />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {katalogLoading
                    ? "Memuat ketersediaan dari depo Farmasi…"
                    : katalog.length === 0
                      ? "Belum ada BMHP yang di-assign ke depo Farmasi (Mapping Hub → Ketersediaan Farmasi · BMHP)."
                      : `${katalog.length} BMHP tersedia di depo Farmasi. Klik hasil untuk menambah.`}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Prioritas</p>
                <div className="flex flex-wrap gap-1">
                  {PRIORITAS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrioritas(p)}
                      className={cn(
                        "flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition",
                        prioritas === p
                          ? p === "CITO"
                            ? "border-rose-400 bg-rose-50 text-rose-700"
                            : "border-teal-400 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      {p === "CITO" && <Zap size={11} />}{p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-[11px] text-slate-500">
                <p className="flex items-center gap-1.5 font-medium text-slate-600"><Package size={12} className="text-teal-500" /> Cara order</p>
                <p className="mt-1">Cari & klik BMHP → muncul di Daftar Order (kanan). Sesuaikan jumlah & keterangan per baris, lalu kirim ke depo.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: list + catatan */}
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-slate-700">Daftar Order BMHP</p>
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-700">{items.length}</span>
              </div>
              {items.length > 0 && (
                <button onClick={removeAll} className="text-[11px] text-slate-400 transition hover:text-rose-500">Hapus semua</button>
              )}
            </div>
            <div className="p-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-300"><Package size={18} /></span>
                  <p className="text-xs text-slate-400">Belum ada BMHP dalam order</p>
                  <p className="text-[11px] text-slate-300">Cari BMHP di form kiri, atau salin dari riwayat di bawah</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map((it, i) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      index={i}
                      onChange={updateItem}
                      onRemove={() => removeItem(it.id)}
                      stok={it.bmhpId ? stokMap.get(it.bmhpId) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && total > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
                <span className="text-[11px] font-medium text-slate-500">Estimasi Biaya</span>
                <span className="text-sm font-bold text-teal-700">{formatRp(total)}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Catatan / Instruksi Farmasi</p>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Instruksi khusus untuk petugas farmasi…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200"
            />
          </div>
        </div>
      </div>

      {/* Riwayat order BMHP */}
      <RiwayatOrderBmhp kunjunganId={patient.id} onCopy={copyOrderToForm} canWrite={canOrder} refreshKey={riwayatKey} />

      {/* Sticky footer */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs text-slate-400">
          {items.length === 0 ? (
            "Tambahkan BMHP ke daftar order terlebih dahulu"
          ) : (
            <>
              <span className="font-semibold text-slate-700">{items.length} item</span> siap diorder ke{" "}
              <span className="font-semibold text-slate-700">{depo}</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          {!canOrder && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
              <AlertCircle size={12} /> Hanya dokter &amp; perawat yang dapat mengorder BMHP
            </span>
          )}
          <button
            onClick={submitOrder}
            disabled={items.length === 0 || sending || !canOrder}
            title={!canOrder ? "Hanya dokter & perawat yang dapat order BMHP" : undefined}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShieldCheck size={13} />
            {sending ? "Mengirim…" : "Kirim Order BMHP"}
          </button>
        </div>
      </div>
    </div>
  );
}
