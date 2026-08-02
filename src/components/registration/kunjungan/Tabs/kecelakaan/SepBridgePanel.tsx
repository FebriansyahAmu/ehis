"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, ShieldCheck, Layers, Loader2, CheckCircle2, AlertTriangle, MapPinOff, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  syncKecelakaanToSep, listSuplesiKandidat,
  type SepJaminanSyncDTO, type SuplesiKandidatDTO,
} from "@/lib/api/kecelakaan";
import type { KecelakaanDraft } from "./kecelakaanTypes";

const lbl = "mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400";
const inp = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 placeholder:text-slate-300 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100";

const LAKA_LABEL: Record<SepJaminanSyncDTO["lakaLantas"], string> = {
  BKLL:    "Bukan Kecelakaan Lalu Lintas",
  KLL_BKK: "KLL — bukan kecelakaan kerja",
  KLL_KK:  "KLL sekaligus kecelakaan kerja",
  KK:      "Kecelakaan Kerja",
};

function deriveLaka(jenis: string): SepJaminanSyncDTO["lakaLantas"] {
  if (jenis === "kll") return "KLL_BKK";
  if (jenis === "kerja") return "KK";
  return "BKLL";
}

export function SepBridgePanel({
  kunjunganId, draft, setDraft,
}: {
  kunjunganId: string;
  draft: KecelakaanDraft;
  setDraft: React.Dispatch<React.SetStateAction<KecelakaanDraft>>;
}) {
  const [kandidat, setKandidat] = useState<SuplesiKandidatDTO[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SepJaminanSyncDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Kandidat No. SEP suplesi (SEP KLL terbit pasien, lintas kunjungan).
  useEffect(() => {
    const ac = new AbortController();
    listSuplesiKandidat(kunjunganId, ac.signal)
      .then(setKandidat)
      .catch(() => { /* abaikan — picker manual tetap tersedia */ });
    return () => ac.abort();
  }, [kunjunganId]);

  const handleSync = async () => {
    setSyncing(true);
    setErr(null);
    try {
      const { data } = await syncKecelakaanToSep(kunjunganId);
      setResult(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyinkronkan jaminan ke SEP.");
    } finally {
      setSyncing(false);
    }
  };

  const lakaPreview = deriveLaka(draft.jenis);

  return (
    <div className="space-y-3 rounded-2xl border border-sky-200 bg-linear-to-br from-sky-50/70 via-sky-50/30 to-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-100">
          <Link2 size={12} className="text-sky-600" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Jaminan BPJS · SEP</p>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-sky-600 ring-1 ring-sky-200">
          V-Claim
        </span>
      </div>

      {/* ── Suplesi ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={draft.suplesi}
            onChange={(e) => setDraft((d) => ({ ...d, suplesi: e.target.checked }))}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-sky-600 focus:ring-sky-200"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
              <Layers size={12} className="text-sky-500" /> Perawatan lanjutan (suplesi)
            </span>
            <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-400">
              Kunjungan ini kelanjutan perawatan kecelakaan yang sama — tautkan ke No. SEP awal (episode 1).
            </span>
          </span>
        </label>

        <AnimatePresence>
          {draft.suplesi && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }} className="overflow-hidden"
            >
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                {kandidat.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {kandidat.map((k) => {
                      const active = draft.noSepSuplesi === k.noSep;
                      return (
                        <button
                          key={k.noSep}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, noSepSuplesi: k.noSep }))}
                          className={cn(
                            "rounded-lg border px-2.5 py-1 text-left text-[10px] font-mono transition",
                            active ? "border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200" : "border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:bg-sky-50/50",
                          )}
                          title={`Terbit ${k.tglSep}`}
                        >
                          {k.noSep}
                          <span className="ml-1 font-sans text-[8.5px] text-slate-400">{k.tglSep}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div>
                  <p className={lbl}>No. SEP Suplesi (awal)</p>
                  <input
                    className={cn(inp, "font-mono tracking-wide")}
                    placeholder="Nomor SEP kecelakaan sebelumnya…"
                    value={draft.noSepSuplesi}
                    onChange={(e) => setDraft((d) => ({ ...d, noSepSuplesi: e.target.value }))}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Preview + Sinkronkan ── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
        <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-500">
          <Info size={11} className="mt-0.5 shrink-0 text-slate-400" />
          Menyalin ke SEP aktif: <span className="font-semibold text-slate-600">Laka Lantas ({LAKA_LABEL[lakaPreview]})</span>,
          No. LP, tgl kejadian, kronologi{draft.suplesi ? ", suplesi" : ""}. Berdasarkan data <span className="font-semibold">tersimpan</span> — simpan dulu bila ada perubahan.
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[9.5px] text-slate-400">
          <MapPinOff size={10} className="shrink-0" /> Kode wilayah kejadian (lokasiLaka) ditunda — menunggu referensi wilayah BPJS.
        </p>
      </div>

      {err && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700 ring-1 ring-rose-100">
          <AlertTriangle size={13} className="shrink-0" /> {err}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3"
          >
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
              <CheckCircle2 size={13} /> Jaminan tersinkron ke SEP {result.noSep ?? "—"}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-emerald-700">
              <span>Laka: <b>{LAKA_LABEL[result.lakaLantas]}</b></span>
              {result.noLp && <span>No. LP: <b>{result.noLp}</b></span>}
              {result.tglKejadian && <span>Tgl: <b>{result.tglKejadian}</b></span>}
              {result.suplesi && <span>Suplesi: <b>{result.noSepSuplesi || "ya"}</b></span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-300 bg-white px-4 py-2 text-[12px] font-bold text-sky-700 shadow-sm transition hover:bg-sky-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {syncing ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
        {syncing ? "Menyinkronkan…" : "Sinkronkan ke SEP"}
      </button>
    </div>
  );
}
