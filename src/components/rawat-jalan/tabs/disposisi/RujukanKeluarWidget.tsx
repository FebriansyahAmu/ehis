"use client";

// Widget status "Surat Rujukan Keluar" — tampil di bawah selektor Jenis Disposisi saat tipe
// "rujuk-eksternal" dipilih. Background HIJAU bila ≥1 surat rujukan sudah terbit, menampilkan
// detail surat TERBARU + tombol CETAK (buka RujukanCetakModal dari snapshot detail) + Batalkan.
// Dua sumber data: pasien PERSISTED (UUID) → fetch DB (listRujukan); pasien DEMO (non-UUID) →
// `localItems` (in-session, tak persist). Bila belum ada surat → render null.

import { useEffect, useState } from "react";
import {
  CheckCircle2, Printer, Trash2, Loader2, ArrowRight, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listRujukan, deleteRujukan, type RujukanEksternalDTO } from "@/lib/api/rujukanEksternal/rujukanEksternal";
import RujukanCetakModal from "./RujukanCetakModal";
import type { RujukanCetakData } from "./RujukanCetakTemplate";

const TIPE_LABEL: Record<string, string> = { "0": "Rujukan Penuh", "1": "Rujukan Partial", "2": "Rujukan Balik PRB" };
const JNS_LABEL: Record<string, string> = { "1": "Rawat Inap", "2": "Rawat Jalan" };

interface Entry {
  id: string;
  nomor: string;
  detail: RujukanCetakData;
}

function fmtTgl(ymd?: string): string {
  if (!ymd) return "—";
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/70 px-2.5 py-1.5 ring-1 ring-emerald-200">
      <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70">{label}</p>
      <p className="text-[11px] font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default function RujukanKeluarWidget({
  kunjunganId,
  isPersisted,
  localItems,
  onRemoveLocal,
  refreshKey = 0,
}: {
  kunjunganId: string;
  isPersisted: boolean;
  /** Surat rujukan in-session (pasien demo/non-UUID). */
  localItems?: RujukanCetakData[];
  onRemoveLocal?: (nomor: string) => void;
  refreshKey?: number;
}) {
  const [dbItems, setDbItems] = useState<RujukanEksternalDTO[]>([]);
  const [loading, setLoading] = useState(isPersisted);
  const [reprint, setReprint] = useState<RujukanCetakData | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);

  function refetch(signal?: AbortSignal) {
    return listRujukan(kunjunganId, signal)
      .then((rows) => {
        setDbItems(rows);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    if (!isPersisted) return; // demo → pakai localItems, tanpa fetch
    const ac = new AbortController();
    void refetch(ac.signal);
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunjunganId, refreshKey, isPersisted]);

  const entries: Entry[] = isPersisted
    ? dbItems.map((it) => ({ id: it.id, nomor: it.nomor, detail: it.detail }))
    : (localItems ?? []).map((d) => ({ id: d.noRujukan, nomor: d.noRujukan, detail: d }));

  async function handleBatal(entry: Entry) {
    if (isPersisted) {
      setBusyId(entry.id);
      try {
        await deleteRujukan(kunjunganId, entry.id);
        await refetch();
      } catch {
        /* abaikan */
      }
      setBusyId(null);
    } else {
      onRemoveLocal?.(entry.nomor);
    }
    setConfirmId(null);
  }

  if (loading || entries.length === 0) return null; // widget hanya muncul saat surat sudah terbit

  const latest = entries[0];
  const d = latest.detail;
  const others = entries.slice(1);
  const isConfirm = confirmId === latest.id;
  const isBusy = busyId === latest.id;

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-300 bg-emerald-50 shadow-sm">
      <RujukanCetakModal open={!!reprint} onClose={() => setReprint(null)} data={reprint} />

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-100/70 px-4 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <CheckCircle2 size={15} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-emerald-800">Surat Rujukan Sudah Terbit</p>
          <p className="text-[10px] text-emerald-700/80">
            Rujukan keluar {isPersisted ? "tersimpan" : "(demo — tak tersimpan)"} · dapat dicetak ulang
          </p>
        </div>
        <span className="ml-auto rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
          {entries.length} surat
        </span>
      </div>

      {/* Detail surat terbaru */}
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">No. Rujukan</p>
            <p className="font-mono text-sm font-bold tracking-wider text-emerald-800">{latest.nomor}</p>
            <div className="mt-1.5 flex items-start gap-1.5">
              <ArrowRight size={13} className="mt-0.5 shrink-0 text-emerald-500" />
              <p className="text-xs font-semibold text-slate-800">
                {d.tujuanRujukan?.nama || "—"}
                {d.tujuanRujukan?.kode && <span className="ml-1 font-mono text-[10px] font-normal text-slate-400">({d.tujuanRujukan.kode})</span>}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {isConfirm ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-rose-600">Batalkan surat?</span>
                <button
                  type="button"
                  onClick={() => handleBatal(latest)}
                  disabled={isBusy}
                  className="flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {isBusy ? <Loader2 size={11} className="animate-spin" /> : null} Ya
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50"
                >
                  Tidak
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setReprint(d)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                >
                  <Printer size={13} /> Cetak Surat
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(latest.id)}
                  title="Batalkan rujukan"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-white text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chips detail */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <InfoChip label="Jenis" value={JNS_LABEL[d.jnsPelayanan] ?? "—"} />
          <InfoChip label="Tipe" value={TIPE_LABEL[d.tipeRujukan] ?? "—"} />
          <InfoChip label="Tgl Rujukan" value={fmtTgl(d.tglRujukan)} />
          <InfoChip label="Berlaku s/d" value={fmtTgl(d.tglBerlakuKunjungan)} />
          {d.tipeRujukan !== "2" && d.poliTujuan?.nama && <InfoChip label="Poli Tujuan" value={d.poliTujuan.nama} />}
          <InfoChip label="Diagnosa" value={`${d.diagnosa?.nama || "—"}${d.diagnosa?.kode ? ` (${d.diagnosa.kode})` : ""}`} />
        </div>

        <p className="mt-2.5 text-[10px] text-emerald-700/70">
          Diterbitkan oleh {d.pencatat || "—"} · {fmtTgl(d.terbitAt?.slice(0, 10))}
        </p>

        {/* Surat lain (bila >1) */}
        {others.length > 0 && (
          <div className="mt-3 border-t border-emerald-200 pt-2.5">
            <button
              type="button"
              onClick={() => setShowOthers((s) => !s)}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              <ChevronDown size={13} className={cn("transition-transform", showOthers && "rotate-180")} />
              {showOthers ? "Sembunyikan" : `Lihat ${others.length} surat rujukan lain`}
            </button>
            {showOthers && (
              <ul className="mt-2 space-y-1.5">
                {others.map((it) => (
                  <li
                    key={it.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-white/70 px-3 py-2 ring-1 ring-emerald-100"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[11px] font-semibold text-emerald-700">{it.nomor}</span>
                      <span className="ml-2 text-[11px] text-slate-500">
                        {it.detail.tujuanRujukan?.nama || "—"} · {fmtTgl(it.detail.tglRujukan)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReprint(it.detail)}
                      className="flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <Printer size={11} /> Cetak
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatal(it)}
                      disabled={busyId === it.id}
                      title="Batalkan"
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                    >
                      {busyId === it.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
