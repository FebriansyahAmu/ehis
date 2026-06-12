"use client";

// Daftar Persetujuan — sub-menu tab IC: lihat IC yang sudah dibuat + cetak A4.
// Self-fetch daftar (getInformedConsent) saat mount; "Lihat & Cetak" → getInformedConsentDetail
// (termasuk TTD image) → ICCetakModal. Pasien demo (non-UUID) → banner (tak ada data persist).

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText, Printer, Loader2, CheckCircle2, XCircle, PenLine, RefreshCw, Info, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getInformedConsent, getInformedConsentDetail,
  type InformedConsentDTO, type InformedConsentDetailDTO,
} from "@/lib/api/informedConsent/informedConsent";
import { toast } from "@/lib/ui/toastStore";
import ICCetakModal from "./ICCetakModal";

function fmtWaktu(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function DaftarICPane({
  kunjunganId, isPersisted, patient,
}: {
  kunjunganId: string;
  isPersisted: boolean;
  patient: { name: string; noRM: string };
}) {
  const [rows, setRows] = useState<InformedConsentDTO[]>([]);
  const [loading, setLoading] = useState(isPersisted);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<InformedConsentDetailDTO | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback((signal?: AbortSignal) => {
    if (!isPersisted) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    getInformedConsent(kunjunganId, signal)
      .then(setRows)
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("Gagal memuat daftar persetujuan");
      })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  }, [kunjunganId, isPersisted]);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  const openCetak = useCallback(async (id: string) => {
    setPrintingId(id);
    try {
      const d = await getInformedConsentDetail(kunjunganId, id);
      setDetail(d);
      setModalOpen(true);
    } catch {
      toast.error("Gagal memuat detail persetujuan");
    } finally {
      setPrintingId(null);
    }
  }, [kunjunganId]);

  // ── Pasien demo (non-UUID) ──
  if (!isPersisted) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-[11px] leading-snug text-amber-700">
          <strong>Pasien demo.</strong> Daftar persetujuan hanya tersedia untuk kunjungan nyata
          (tersimpan ke database). Buat &amp; simpan persetujuan dari sub-menu <em>Buat Persetujuan</em>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-sky-500" />
        <p className="text-xs font-bold text-slate-700">Daftar Persetujuan Tindakan</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          {rows.length}
        </span>
        <button
          type="button"
          onClick={() => load()}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:bg-slate-50"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Muat ulang
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertTriangle size={14} className="shrink-0 text-rose-500" />
          <p className="text-[11px] text-rose-700">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-10 text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin" /> Memuat daftar…
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-slate-200">
            <FileText size={20} className="text-slate-300" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Belum ada persetujuan tersimpan</p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Buat formulir dari sub-menu <em>Buat Persetujuan</em>
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r, i) => {
            const setuju = r.keputusan === "setuju";
            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs"
              >
                <span className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                  setuju ? "bg-emerald-50 text-emerald-600 ring-emerald-200" : "bg-rose-50 text-rose-600 ring-rose-200",
                )}>
                  {setuju ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-semibold text-slate-800">{r.tindakanNama}</p>
                    <span className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1",
                      setuju ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200",
                    )}>
                      {setuju ? "Setuju" : "Menolak"}
                    </span>
                    {r.hasSignature && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-600 ring-1 ring-sky-200">
                        <PenLine size={9} /> TTD
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10px] text-slate-400">
                    <span className="font-mono">{r.noFormulir}</span> · {fmtWaktu(r.waktuPersetujuan)} · {r.namaDokter}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openCetak(r.id)}
                  disabled={printingId === r.id}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
                >
                  {printingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Printer size={12} />}
                  Lihat &amp; Cetak
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}

      <ICCetakModal open={modalOpen} onClose={() => setModalOpen(false)} detail={detail} patient={patient} />
    </div>
  );
}
