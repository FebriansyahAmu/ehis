"use client";

// Pane generik untuk Tarif Ruang Rawat & Tarif Administrasi (config-driven). Penjamin = tab (pola
// Tarif Matrix; hanya UMUM aktif — Tarif PERDA). Baris = kelas/unit; klik baris → editor inline
// (Total / Rinci komponen PMK 85). Auto-save optimistik (upsert by pair / delete → "belum diisi").

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Pencil, Trash2, Check, X, Layers, Wallet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { PENJAMIN_TIPE_CFG, fmtRupiah } from "@/lib/master/penjaminMock";
import { toast } from "@/lib/ui/toastStore";
import { DatePicker } from "@/components/shared/inputs";
import ConfirmDialog from "@/components/master/ruangan/ConfirmDialog";
import { TARIF_PENJAMIN, roundIDR } from "../tarifShared";
import {
  type SimpleTarifConfig, type SimpleTarifMap, type SimpleCell, type SimpleTarifInput,
  simpleMapFromEdges, getSimpleCell, setSimpleCell, clearSimpleCell,
} from "./tarifSimpleShared";

/** "YYYY-MM-DD" → "15 Jul 2026". Kosong → "". */
function fmtTgl(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const PENDING = "__pending__";

export default function TarifSimplePane({ config }: { config: SimpleTarifConfig }) {
  const firstEnabled = TARIF_PENJAMIN.find((p) => p.enabled) ?? TARIF_PENJAMIN[0];
  const [activeKode, setActiveKode] = useState(firstEnabled?.kode ?? "");
  const [map, setMap] = useState<SimpleTarifMap>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<{ rowKey: string; label: string; harga: number } | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const edges = await config.listAll(ac.signal);
        if (!ac.signal.aborted && !dirtyRef.current) setMap(simpleMapFromEdges(edges));
      } catch {
        /* biarkan kosong — grid tampil "belum diisi" */
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.id]);

  const reload = async () => {
    try {
      const edges = await config.listAll();
      setMap(simpleMapFromEdges(edges));
    } catch { /* pertahankan */ }
  };

  const sheet = map[activeKode] ?? {};
  const stats = useMemo(() => {
    const s = map[activeKode] ?? {};
    const vals = config.rows.map((r) => s[r.key]?.harga ?? 0).filter((v) => v > 0);
    const filled = vals.length;
    return { filled, total: config.rows.length };
  }, [map, activeKode, config.rows]);

  const handleSave = (rowKey: string, input: SimpleTarifInput) => {
    dirtyRef.current = true;
    const existing = getSimpleCell(map, activeKode, rowKey);
    setEditing(null);
    setMap((m) => setSimpleCell(m, activeKode, rowKey, {
      id: existing?.id ?? PENDING,
      harga: input.harga, jasaSarana: input.jasaSarana, jasaMedis: input.jasaMedis, jasaParamedis: input.jasaParamedis,
      noSk: input.noSk, tglSk: input.tglSk,
    }));
    setBusy(true);
    config.upsert(rowKey, activeKode, input)
      .then((edge) => setMap((m) => setSimpleCell(m, activeKode, rowKey, {
        id: edge.id, harga: edge.harga, jasaSarana: edge.jasaSarana, jasaMedis: edge.jasaMedis, jasaParamedis: edge.jasaParamedis,
        noSk: edge.noSk, tglSk: edge.tglSk,
      })))
      .catch(() => { toast.error("Gagal menyimpan tarif"); void reload(); })
      .finally(() => setBusy(false));
  };

  // Minta konfirmasi dulu (buka ConfirmDialog) — hapus tarif = destruktif.
  const requestClear = (rowKey: string, label: string) => {
    const existing = getSimpleCell(map, activeKode, rowKey);
    if (!existing) { setEditing(null); return; }
    setConfirmDel({ rowKey, label, harga: existing.harga });
  };

  const handleClear = (rowKey: string) => {
    const existing = getSimpleCell(map, activeKode, rowKey);
    if (!existing) { setEditing(null); return; }
    dirtyRef.current = true;
    setEditing(null);
    setMap((m) => clearSimpleCell(m, activeKode, rowKey));
    if (existing.id !== PENDING) {
      setBusy(true);
      config.remove(existing.id)
        .catch(() => { toast.error("Gagal menghapus tarif"); void reload(); })
        .finally(() => setBusy(false));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="m-base font-bold text-slate-900">{config.title}</h2>
              {busy && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 m-mini font-medium text-slate-500"><Loader2 size={9} className="animate-spin" /> Menyimpan…</span>}
            </div>
            <p className="mt-0.5 m-tiny text-slate-500">{config.subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600"><Wallet size={12} /></span>
            <div>
              <p className="m-mini font-medium uppercase tracking-wide text-slate-400">Terisi</p>
              <p className="m-base font-black leading-none text-slate-900">{stats.filled}/{stats.total}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Penjamin tabs */}
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.03 }}
        className="shrink-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm"
      >
        <div className="flex items-center gap-1">
          {TARIF_PENJAMIN.map((p) => {
            const cfg = PENJAMIN_TIPE_CFG[p.tipe];
            const active = p.kode === activeKode && p.enabled;
            const disabled = !p.enabled;
            return (
              <button
                key={p.kode}
                type="button"
                disabled={disabled}
                onClick={() => { if (p.enabled) { setActiveKode(p.kode); setEditing(null); } }}
                title={disabled ? p.note : undefined}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 m-xs font-semibold transition",
                  disabled ? "cursor-not-allowed text-slate-300"
                    : active ? cn(cfg.bg, cfg.text, "ring-1 ring-amber-200") : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", disabled ? "bg-slate-300" : cfg.dot)} />
                  <span>{p.nama}</span>
                  {disabled && <span className="rounded bg-slate-100 px-1 m-mini font-semibold text-slate-400">Nonaktif</span>}
                </div>
              </button>
            );
          })}
          <span className="ml-1.5 hidden items-center gap-1 m-mini text-slate-400 sm:flex">· Tarif PERDA berlaku semua jaminan</span>
        </div>
      </motion.div>

      {/* Rows */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.06 }}
        className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {loading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 size={14} className="animate-spin" /> Memuat tarif…
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {config.rows.map((row) => {
              const cell = sheet[row.key];
              const isEditing = editing === row.key;
              return (
                <li key={row.key} className="px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="m-sm font-semibold text-slate-800">{row.label}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 m-mini font-mono text-slate-500">{config.rowHeader}</span>
                      </div>
                      {(cell?.noSk || cell?.tglSk) && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 m-mini font-semibold text-indigo-700">
                          <FileText size={9} />
                          {cell.noSk ? `SK ${cell.noSk}` : "SK"}
                          {cell.tglSk && <span className="font-normal text-indigo-500">· {fmtTgl(cell.tglSk)}</span>}
                        </span>
                      )}
                      {row.hint && <p className="mt-0.5 m-mini text-slate-400">{row.hint}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {cell ? (
                        <div className="text-right">
                          <p className="m-sm font-bold tabular-nums text-slate-900">
                            {fmtRupiah(cell.harga)}<span className="m-mini font-normal text-slate-400">{config.unitSuffix}</span>
                          </p>
                          {(cell.jasaSarana != null) && (
                            <p className="m-mini text-slate-400">
                              Sarana {fmtRupiah(cell.jasaSarana)} · Medis {fmtRupiah(cell.jasaMedis ?? 0)} · Paramedis {fmtRupiah(cell.jasaParamedis ?? 0)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="m-xs italic text-slate-400">Belum diisi</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditing(isEditing ? null : row.key)}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg border transition",
                          isEditing ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500 hover:bg-slate-50",
                        )}
                        aria-label="Ubah tarif"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <RowEditor
                      cell={cell}
                      unitSuffix={config.unitSuffix}
                      onSave={(input) => handleSave(row.key, input)}
                      onClear={() => requestClear(row.key, row.label)}
                      onCancel={() => setEditing(null)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>

      {/* Konfirmasi hapus tarif (destruktif) */}
      <ConfirmDialog
        open={!!confirmDel}
        kindLabel="Tarif"
        name={confirmDel ? `${config.rowHeader} ${confirmDel.label}` : ""}
        kode={confirmDel ? `${fmtRupiah(confirmDel.harga)}${config.unitSuffix ?? ""}` : undefined}
        icon={Wallet}
        confirmLabel="Ya, Hapus"
        message={confirmDel ? (
          <>
            Tarif ini akan{" "}
            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-600 ring-1 ring-rose-100">dihapus</span>{" "}
            (kembali <span className="italic">&quot;belum diisi&quot;</span>) untuk penjamin{" "}
            <span className="font-semibold text-slate-700">
              {TARIF_PENJAMIN.find((p) => p.kode === activeKode)?.nama ?? activeKode}
            </span>.
          </>
        ) : undefined}
        onConfirm={() => { if (confirmDel) handleClear(confirmDel.rowKey); setConfirmDel(null); }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}

// ── Row editor (inline) ──────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 m-sm font-mono tabular-nums text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100";

const digits = (s: string): number => {
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
};

function RowEditor({
  cell, unitSuffix, onSave, onClear, onCancel,
}: {
  cell?: SimpleCell;
  unitSuffix?: string;
  onSave: (input: SimpleTarifInput) => void;
  onClear: () => void;
  onCancel: () => void;
}) {
  const startRinci = cell?.jasaSarana != null;
  const [mode, setMode] = useState<"total" | "rinci">(startRinci ? "rinci" : "total");
  const [harga, setHarga] = useState(cell?.harga ?? 0);
  const [sarana, setSarana] = useState(cell?.jasaSarana ?? 0);
  const [medis, setMedis] = useState(cell?.jasaMedis ?? 0);
  const [paramedis, setParamedis] = useState(cell?.jasaParamedis ?? 0);
  const [noSk, setNoSk] = useState(cell?.noSk ?? "");
  const [tglSk, setTglSk] = useState(cell?.tglSk ?? "");

  const rinciTotal = sarana + medis + paramedis;
  const canSave = mode === "total" ? harga > 0 : rinciTotal > 0;

  const submit = () => {
    if (!canSave) return;
    const meta = { noSk: noSk.trim() || null, tglSk: tglSk || null };
    if (mode === "total") {
      onSave({ harga: roundIDR(harga), jasaSarana: null, jasaMedis: null, jasaParamedis: null, ...meta });
    } else {
      onSave({ harga: rinciTotal, jasaSarana: sarana, jasaMedis: medis, jasaParamedis: paramedis, ...meta });
    }
  };

  return (
    <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50/40 p-3">
      {/* Mode toggle */}
      <div className="mb-2.5 flex items-center gap-1 self-start rounded-lg border border-slate-200 bg-white p-0.5 w-fit">
        <ModeBtn active={mode === "total"} onClick={() => setMode("total")} icon={Wallet} label="Total" />
        <ModeBtn active={mode === "rinci"} onClick={() => setMode("rinci")} icon={Layers} label="Rinci Komponen" />
      </div>

      {mode === "total" ? (
        <label className="block">
          <span className="mb-1 block m-mini font-semibold uppercase tracking-wide text-slate-500">Tarif{unitSuffix}</span>
          <input
            autoFocus inputMode="numeric" value={harga ? harga.toLocaleString("id-ID") : ""}
            onChange={(e) => setHarga(digits(e.target.value))}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
            placeholder="0" className={inputCls}
          />
        </label>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Jasa Sarana" value={sarana} onChange={setSarana} autoFocus onSubmit={submit} onCancel={onCancel} />
          <NumField label="Jasa Medis" value={medis} onChange={setMedis} onSubmit={submit} onCancel={onCancel} />
          <NumField label="Jasa Paramedis" value={paramedis} onChange={setParamedis} onSubmit={submit} onCancel={onCancel} />
          <div className="col-span-3 mt-0.5 flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5">
            <span className="m-mini font-semibold uppercase tracking-wide text-slate-500">Total (auto)</span>
            <span className="m-sm font-bold tabular-nums text-amber-700">{fmtRupiah(rinciTotal)}{unitSuffix}</span>
          </div>
        </div>
      )}

      {/* Metadata SK (opsional) */}
      <div className="mt-2.5 grid grid-cols-1 gap-2 border-t border-amber-200/60 pt-2.5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block m-mini font-semibold uppercase tracking-wide text-slate-500">Nomor SK <span className="font-normal normal-case text-slate-400">· opsional</span></span>
          <input
            value={noSk} onChange={(e) => setNoSk(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
            placeholder="mis. 445/1234/2026" maxLength={80}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 m-sm text-slate-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
          />
        </label>
        <div className="block">
          <span className="mb-1 block m-mini font-semibold uppercase tracking-wide text-slate-500">Tanggal SK <span className="font-normal normal-case text-slate-400">· opsional</span></span>
          <DatePicker value={tglSk} onChange={setTglSk} clearable placeholder="Pilih tanggal SK" />
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-end gap-2">
        {cell && (
          <button type="button" onClick={onClear} className="flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 m-mini font-semibold text-rose-600 transition hover:bg-rose-50">
            <Trash2 size={11} /> Hapus
          </button>
        )}
        <button type="button" onClick={onCancel} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 m-mini font-semibold text-slate-500 transition hover:bg-slate-50">
          <X size={11} /> Batal
        </button>
        <button
          type="button" onClick={submit} disabled={!canSave}
          className={cn("flex items-center gap-1 rounded-lg px-3 py-1.5 m-mini font-semibold text-white transition",
            canSave ? "bg-amber-600 hover:bg-amber-700" : "cursor-not-allowed bg-slate-300")}
        >
          <Check size={11} /> Simpan
        </button>
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Wallet; label: string }) {
  return (
    <button
      type="button" onClick={onClick}
      className={cn("flex items-center gap-1 rounded-md px-2 py-1 m-mini font-semibold transition",
        active ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-slate-50")}
    >
      <Icon size={11} /> {label}
    </button>
  );
}

function NumField({
  label, value, onChange, autoFocus, onSubmit, onCancel,
}: {
  label: string; value: number; onChange: (n: number) => void; autoFocus?: boolean;
  onSubmit: () => void; onCancel: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block m-mini font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        autoFocus={autoFocus} inputMode="numeric" value={value ? value.toLocaleString("id-ID") : ""}
        onChange={(e) => onChange(digits(e.target.value))}
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); if (e.key === "Escape") onCancel(); }}
        placeholder="0" className={inputCls}
      />
    </label>
  );
}
