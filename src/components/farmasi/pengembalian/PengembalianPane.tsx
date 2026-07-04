"use client";

// Pengembalian Obat pasien pulang (PMK 72/2016 Ps. 20) — sub "Kembalian Obat" tab Pasien
// Pulang RI. DUAL-MODE: kunjungan UUID → persist `medicalrecord.PengembalianObat`
// (/kunjungan/:id/pengembalian — buat Draft dari order resep DB, koreksi replace-all,
// verifikasi HANYA Apoteker [refinement server], stamp sekali); demo → mock lokal.
// perawatPenyerah/apotekerPenerima = user login (server-otoritatif). Kondisi/Alasan pakai
// Select global (bukan <select> native).

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight, AlertTriangle, CheckCircle2, Package,
  ChevronDown, ChevronUp, Shield, ClipboardCheck, Plus,
  Pill, RotateCcw, Save, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/contexts/SessionContext";
import { Select } from "@/components/shared/inputs";
import { listResep, type ResepOrderDTO } from "@/lib/api/resep/resep";
import {
  listPengembalian, createPengembalian, updatePengembalian, verifyPengembalian,
  type PengembalianDTO,
} from "@/lib/api/pengembalian/pengembalian";
import {
  getPengembalianForRM,
  totalKembalian,
  KONDISI_CFG,
  STATUS_PENGEMBALIAN_CFG,
  ALASAN_OPTIONS,
  type PengembalianRecord,
  type ItemKembalian,
  type KondisiObat,
  type AlasanKembalian,
  type StatusPengembalian,
} from "./pengembalianShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** DTO server → bentuk view FE (mirror PengembalianRecord). */
function dtoToRecord(d: PengembalianDTO, noRM: string): PengembalianRecord {
  return {
    id: d.id,
    noRM,
    tanggal: d.tanggal,
    noResepRef: d.noResepRef || "—",
    perawatPenyerah: d.perawatPenyerah,
    apotekerPenerima: d.apotekerPenerima,
    status: d.status as StatusPengembalian,
    verifiedAt: d.verifiedAt ?? undefined,
    catatan: d.catatan || undefined,
    items: d.items.map((i) => ({
      id: i.id,
      resepItemId: i.resepItemId ?? "",
      namaObat: i.namaObat,
      satuan: i.satuan,
      isHAM: i.isHAM,
      isNarPsi: i.isNarPsi,
      jumlahDispensasi: i.jumlahDispensasi,
      jumlahDiberikan: i.jumlahDiberikan,
      jumlahKembalikan: i.jumlahKembalikan,
      kondisi: i.kondisi as KondisiObat,
      alasan: i.alasan as AlasanKembalian,
    })),
  };
}

/** Payload item PATCH/POST dari state FE. */
function itemsToInput(items: ItemKembalian[]) {
  return items.map((i) => ({
    resepItemId: UUID_RE.test(i.resepItemId) ? i.resepItemId : undefined,
    namaObat: i.namaObat,
    satuan: i.satuan,
    isHAM: i.isHAM,
    isNarPsi: i.isNarPsi,
    jumlahDispensasi: i.jumlahDispensasi,
    jumlahDiberikan: i.jumlahDiberikan,
    jumlahKembalikan: i.jumlahKembalikan,
    kondisi: i.kondisi,
    alasan: i.alasan,
  }));
}

// ── Item row (editable) ───────────────────────────────────

function ItemRow({
  item,
  onUpdate,
  locked,
}: {
  item: ItemKembalian;
  onUpdate: (patch: Partial<ItemKembalian>) => void;
  locked: boolean;
}) {
  const selisih = item.jumlahDispensasi - item.jumlahDiberikan;

  return (
    <div className={cn(
      "rounded-xl border bg-white p-3 space-y-2 transition-colors",
      item.isHAM ? "border-rose-200" : "border-slate-200",
    )}>
      {/* Drug name + badges */}
      <div className="flex items-start gap-2">
        <Pill size={13} className={cn("mt-0.5 shrink-0", item.isHAM ? "text-rose-500" : "text-slate-400")} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-800 leading-tight">{item.namaObat}</span>
            {item.isHAM && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 ring-1 ring-rose-200">
                <AlertTriangle size={8} />HAM
              </span>
            )}
            {item.isNarPsi && (
              <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 ring-1 ring-purple-200">
                NAR/PSI
              </span>
            )}
          </div>
          {item.lotNo && (
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
              LOT {item.lotNo} · EXP {item.expiredDate}
            </p>
          )}
        </div>
      </div>

      {/* Quantity strip */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Dispensasi", val: item.jumlahDispensasi, cls: "text-slate-600" },
          { label: "Diberikan",  val: item.jumlahDiberikan,  cls: "text-sky-600"   },
          { label: "Sisa",       val: selisih,                cls: selisih > 0 ? "text-amber-600" : "text-slate-400" },
        ].map(({ label, val, cls }) => (
          <div key={label} className="rounded-lg bg-slate-50 py-1.5">
            <p className={cn("text-base font-bold tabular-nums leading-none", cls)}>{val}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-3 gap-2">
        {/* Diberikan (dipakai pasien) */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 block mb-1">Diberikan</label>
          <input
            type="number"
            min={0}
            max={item.jumlahDispensasi}
            value={item.jumlahDiberikan}
            disabled={locked}
            onChange={(e) => {
              const diberikan = Math.min(item.jumlahDispensasi, Math.max(0, +e.target.value));
              onUpdate({
                jumlahDiberikan: diberikan,
                jumlahKembalikan: Math.min(item.jumlahKembalikan, item.jumlahDispensasi - diberikan),
              });
            }}
            className={cn(
              "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-bold text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-400",
              locked && "opacity-50 cursor-not-allowed",
            )}
          />
        </div>

        {/* Jumlah kembali */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 block mb-1">Dikembalikan</label>
          <input
            type="number"
            min={0}
            max={selisih}
            value={item.jumlahKembalikan}
            disabled={locked}
            onChange={(e) => onUpdate({ jumlahKembalikan: Math.min(Math.max(0, selisih), Math.max(0, +e.target.value)) })}
            className={cn(
              "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-bold text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-400",
              locked && "opacity-50 cursor-not-allowed",
            )}
          />
        </div>

        {/* Kondisi */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 block mb-1">Kondisi</label>
          {locked ? (
            <p className={cn("rounded-lg px-2 py-1.5 text-center text-xs font-bold", KONDISI_CFG[item.kondisi].badge)}>
              {item.kondisi}
            </p>
          ) : (
            <Select
              value={item.kondisi}
              onChange={(v) => onUpdate({ kondisi: v as KondisiObat })}
              options={["Baik", "Rusak", "Kadaluarsa"]}
              placeholder="Pilih…"
            />
          )}
        </div>
      </div>

      {/* Alasan */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 block mb-1">Alasan</label>
        {locked ? (
          <p className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">{item.alasan}</p>
        ) : (
          <Select
            value={item.alasan}
            onChange={(v) => onUpdate({ alasan: v as AlasanKembalian })}
            options={[...ALASAN_OPTIONS]}
            placeholder="Pilih alasan…"
          />
        )}
      </div>

      {/* HAM warning */}
      {item.isHAM && item.jumlahKembalikan > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2">
          <Shield size={12} className="text-rose-600 shrink-0" />
          <p className="text-[11px] text-rose-700 font-medium">
            HAM — wajib verifikasi 2 apoteker sebelum masuk stok depo
          </p>
        </div>
      )}
    </div>
  );
}

// ── Record accordion ──────────────────────────────────────

function RecordCard({
  record,
  isNew,
  canVerify,
  verifyHint,
  onSave,
  onVerify,
}: {
  record: PengembalianRecord;
  isNew?: boolean;
  /** Boleh klik verifikasi (Apoteker / demo). */
  canVerify: boolean;
  /** Hint saat verifikasi terkunci utk aktor ini. */
  verifyHint?: string;
  /** Simpan koreksi Draft (persisted). Absen → edit lokal saja (demo). */
  onSave?: (items: ItemKembalian[], catatan: string) => Promise<boolean>;
  /** Verifikasi penerimaan (persist / demo status lokal). */
  onVerify: (items: ItemKembalian[], catatan: string) => Promise<boolean> | boolean;
}) {
  const [open,    setOpen]    = useState(isNew ?? false);
  const [items,   setItems]   = useState(record.items);
  const [catatan, setCatatan] = useState(record.catatan ?? "");
  const [busy,    setBusy]    = useState<"save" | "verify" | null>(null);

  const cfg     = STATUS_PENGEMBALIAN_CFG[record.status];
  const locked  = record.status !== "Draft";
  const hasHAM  = items.some((i) => i.isHAM && i.jumlahKembalikan > 0);

  function patchItem(id: string, patch: Partial<ItemKembalian>) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
  }

  async function handleSave() {
    if (!onSave || busy) return;
    setBusy("save");
    await onSave(items, catatan);
    setBusy(null);
  }

  async function handleVerify() {
    if (busy) return;
    setBusy("verify");
    await onVerify(items, catatan);
    setBusy(null);
  }

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden shadow-sm transition-all",
      record.status === "Diverifikasi" || record.status === "Selesai"
        ? "border-emerald-200"
        : isNew ? "border-sky-300 ring-1 ring-sky-200" : "border-slate-200",
    )}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <Package size={14} className="text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{record.noResepRef}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", cfg.badge)}>
              {cfg.label}
            </span>
            {hasHAM && (
              <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 ring-1 ring-rose-200">
                HAM
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {record.tanggal} · {totalKembalian({ ...record, items })} unit dikembalikan · {record.items.length} item
            {" · "}penyerah {record.perawatPenyerah}
          </p>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </button>

      {/* Expanded */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
              {/* Items */}
              <div className="space-y-2">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onUpdate={(patch) => patchItem(item.id, patch)}
                    locked={locked}
                  />
                ))}
              </div>

              {/* Perawat (sesi) + catatan */}
              {!locked && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Perawat Penyerah</label>
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2">
                      <span className="truncate text-sm font-semibold text-slate-800">{record.perawatPenyerah}</span>
                      <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-600">
                        Pencatat
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Catatan</label>
                    <input
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Catatan tambahan"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                </div>
              )}

              {locked && record.catatan && (
                <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-500 text-[11px]">Catatan: </span>
                  {record.catatan}
                </div>
              )}

              {/* Verif strip */}
              {locked && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Diverifikasi oleh <strong>{record.apotekerPenerima || "—"}</strong>
                    {record.verifiedAt && (
                      <> · {new Date(record.verifiedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</>
                    )}
                  </p>
                </div>
              )}

              {/* Actions */}
              {!locked && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  {onSave && (
                    <button
                      onClick={() => void handleSave()}
                      disabled={busy !== null}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50 transition-colors disabled:opacity-50"
                    >
                      <Save size={14} />
                      {busy === "save" ? "Menyimpan…" : "Simpan Draft"}
                    </button>
                  )}
                  <div className="flex-1">
                    <button
                      onClick={() => void handleVerify()}
                      disabled={busy !== null || !canVerify}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ClipboardCheck size={14} />
                      {busy === "verify" ? "Memverifikasi…" : "Verifikasi Penerimaan"}
                    </button>
                    {!canVerify && verifyHint && (
                      <p className="mt-1 text-center text-[10px] text-amber-600">{verifyHint}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Summary panel ─────────────────────────────────────────

function SummaryPanel({ records }: { records: PengembalianRecord[] }) {
  const allItems = records.flatMap((r) => r.items);
  const totalUnit = allItems.reduce((s, i) => s + i.jumlahKembalikan, 0);
  const totalHAM  = allItems.filter((i) => i.isHAM && i.jumlahKembalikan > 0).length;
  const selesai   = records.filter((r) => r.status !== "Draft").length;
  const pending   = records.filter((r) => r.status === "Draft").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Total Unit",    val: totalUnit, cls: "text-slate-800"   },
          { label: "Terverifikasi", val: selesai,   cls: "text-emerald-700" },
          { label: "Draft",         val: pending,   cls: pending > 0 ? "text-amber-600" : "text-slate-400" },
          { label: "Item HAM",      val: totalHAM,  cls: totalHAM > 0 ? "text-rose-600" : "text-slate-400" },
        ].map(({ label, val, cls }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className={cn("text-2xl font-bold tabular-nums leading-none", cls)}>{val}</p>
            <p className="text-[11px] text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Guide */}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-2">
        <p className="text-xs font-bold text-sky-800 uppercase tracking-wide">Prosedur PMK 72/2016 Ps. 20</p>
        {[
          "Perawat siapkan obat sisa beserta kemasan asli",
          "Isi formulir pengembalian per item (kondisi + alasan)",
          "Apoteker verifikasi fisik dan cocokkan jumlah",
          "HAM / Nar-Psi: verifikasi 2 apoteker wajib",
          "Stok depo diperbarui setelah verifikasi selesai",
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-200 text-[9px] font-bold text-sky-700">{i + 1}</span>
            <p className="text-[11px] text-sky-700">{s}</p>
          </div>
        ))}
      </div>

      {/* Per-record kondisi breakdown */}
      {records.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Rekap Kondisi</p>
          {(["Baik", "Rusak", "Kadaluarsa"] as const).map((k) => {
            const count = allItems.filter((i) => i.kondisi === k && i.jumlahKembalikan > 0).length;
            if (!count) return null;
            const cfg = KONDISI_CFG[k];
            return (
              <div key={k} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                  <span className="text-xs text-slate-600">{k}</span>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", cfg.badge)}>{count} item</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function PengembalianPane({ noRM, kunjunganId }: { noRM: string; kunjunganId?: string }) {
  const isPersisted = !!kunjunganId && UUID_RE.test(kunjunganId);
  const { session } = useSession();
  const isApoteker =
    !!session && (session.isSuperuser || session.isGlobal || session.roles.includes("Apoteker"));

  const [records, setRecords] = useState<PengembalianRecord[]>(() =>
    isPersisted ? [] : getPengembalianForRM(noRM));
  const [showCreate, setShowCreate] = useState(false);
  const [resepList, setResepList]   = useState<ResepOrderDTO[] | null>(null);
  const [sumberId, setSumberId]     = useState("");
  const [creating, setCreating]     = useState(false);

  useEffect(() => {
    if (!isPersisted || !kunjunganId) return;
    const ac = new AbortController();
    listPengembalian(kunjunganId, ac.signal)
      .then((rows) => setRecords(rows.map((d) => dtoToRecord(d, noRM))))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat pengembalian obat", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId, noRM]);

  // Sumber resep utk dokumen baru (order non-batal kunjungan ini).
  useEffect(() => {
    if (!showCreate || !isPersisted || !kunjunganId || resepList !== null) return;
    const ac = new AbortController();
    listResep(kunjunganId, ac.signal)
      .then((rows) => setResepList(rows.filter((o) => o.status !== "Dibatalkan")))
      .catch(() => setResepList([]));
    return () => ac.abort();
  }, [showCreate, isPersisted, kunjunganId, resepList]);

  async function refetch() {
    if (!isPersisted || !kunjunganId) return;
    const rows = await listPengembalian(kunjunganId);
    setRecords(rows.map((d) => dtoToRecord(d, noRM)));
  }

  const resepLabel = (o: ResepOrderDTO) =>
    `${o.tteToken ?? `RESEP-${o.id.slice(0, 8).toUpperCase()}`} · ${o.depoNama} · ${o.items.length} item${o.isObatPulang ? " · Obat Pulang" : ""}`;

  /** Buat dokumen Draft dari order resep — item derivasi ResepItem (kembalikan diisi belakangan). */
  async function handleCreate() {
    if (!isPersisted || !kunjunganId || !sumberId || creating) return;
    const order = resepList?.find((o) => o.id === sumberId);
    if (!order) return;
    setCreating(true);
    try {
      await createPengembalian(kunjunganId, {
        resepOrderId: order.id,
        noResepRef: order.tteToken ?? `RESEP-${order.id.slice(0, 8).toUpperCase()}`,
        tanggal: new Date().toISOString().slice(0, 10),
        catatan: "",
        items: order.items.map((it) => ({
          resepItemId: it.id,
          namaObat: it.namaObat,
          satuan: "Unit",
          isHAM: it.isHAM,
          isNarPsi: it.kategori !== "Reguler",
          jumlahDispensasi: it.jumlah,
          jumlahDiberikan: it.jumlah,
          jumlahKembalikan: 0,
          kondisi: "Baik" as const,
          alasan: "Pasien Pulang" as const,
        })),
      });
      await refetch();
      toast.success("Dokumen pengembalian dibuat", "Isi jumlah dikembalikan per item, lalu verifikasi Apoteker");
      setShowCreate(false);
      setSumberId("");
    } catch (e) {
      toast.error("Gagal membuat dokumen pengembalian", e instanceof ApiError ? e.message : undefined);
    } finally {
      setCreating(false);
    }
  }

  /** Simpan koreksi Draft (persisted). */
  async function handleSave(id: string, items: ItemKembalian[], catatan: string): Promise<boolean> {
    if (!isPersisted || !kunjunganId) return false;
    try {
      await updatePengembalian(kunjunganId, id, { catatan, items: itemsToInput(items) });
      await refetch();
      toast.success("Draft pengembalian tersimpan");
      return true;
    } catch (e) {
      toast.error("Gagal menyimpan draft", e instanceof ApiError ? e.message : undefined);
      return false;
    }
  }

  /** Verifikasi penerimaan — simpan koreksi terakhir dulu, lalu stamp (server: HANYA Apoteker). */
  async function handleVerify(id: string, items: ItemKembalian[], catatan: string): Promise<boolean> {
    if (!isPersisted || !kunjunganId) {
      // Demo — status lokal.
      setRecords((prev) => prev.map((r) => r.id === id
        ? { ...r, status: "Diverifikasi", verifiedAt: new Date().toISOString() }
        : r));
      return true;
    }
    try {
      await updatePengembalian(kunjunganId, id, { catatan, items: itemsToInput(items) });
      await verifyPengembalian(kunjunganId, id);
      await refetch();
      toast.success("Pengembalian diverifikasi", "Obat sisa diterima Farmasi");
      return true;
    } catch (e) {
      toast.error("Gagal memverifikasi", e instanceof ApiError ? e.message : undefined);
      return false;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_260px]">

      {/* ── Left: records list ── */}
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100">
              <RotateCcw size={14} className="text-sky-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Pengembalian Obat</h3>
              <p className="text-[11px] text-slate-400">PMK 72/2016 Ps. 20 · Obat sisa saat pulang</p>
            </div>
          </div>
          {isPersisted && !showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <Plus size={12} />
              Tambah
            </button>
          )}
        </div>

        {/* Create — pilih resep sumber */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-sky-200 bg-sky-50/70 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wide text-sky-700">
                  Dokumen Pengembalian Baru — dari Order Resep
                </p>
                <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Order Resep Sumber
                  </label>
                  <Select
                    value={sumberId}
                    onChange={setSumberId}
                    options={(resepList ?? []).map((o) => ({ value: o.id, label: resepLabel(o) }))}
                    searchable
                    placeholder={resepList === null ? "Memuat order resep…" : resepList.length === 0 ? "Tidak ada order resep" : "Pilih order resep…"}
                  />
                </div>
                <button
                  onClick={() => void handleCreate()}
                  disabled={!sumberId || creating}
                  className="shrink-0 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creating ? "Membuat…" : "Buat Dokumen"}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-sky-700">
                Item ditarik dari order resep (jumlah dispensasi = jumlah order); sesuaikan &ldquo;Diberikan&rdquo; &amp; &ldquo;Dikembalikan&rdquo; per item.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Records */}
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-14">
            <ArrowLeftRight size={24} className="text-slate-300" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">Belum ada pengembalian obat</p>
              <p className="text-xs text-slate-400 mt-1">Tambahkan saat pasien siap pulang</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec, i) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <RecordCard
                  record={rec}
                  isNew={i === 0 && rec.status === "Draft"}
                  canVerify={isPersisted ? isApoteker : true}
                  verifyHint={isPersisted && !isApoteker
                    ? "Verifikasi penerimaan hanya oleh Apoteker (simpan Draft dulu)"
                    : undefined}
                  onSave={isPersisted ? (items, catatan) => handleSave(rec.id, items, catatan) : undefined}
                  onVerify={(items, catatan) => handleVerify(rec.id, items, catatan)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: summary ── */}
      <aside>
        <SummaryPanel records={records} />
      </aside>
    </div>
  );
}
