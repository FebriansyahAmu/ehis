"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, CheckCircle2, RefreshCw, Search, ShieldCheck, Siren,
} from "lucide-react";
import { RujukanCard } from "./RujukanCard";
import {
  type BpjsRujukanItem, type FetchState,
  getRujukanStatus, getIcdName, fmtDate,
  MOCK_RUJUKAN,
} from "./rujukanTypes";

// ─── Emergency info ───────────────────────────────────────────

const INFO_POINTS = [
  "Peserta BPJS yang mengalami kondisi gawat darurat dapat dilayani di faskes manapun tanpa surat rujukan",
  "SEP IGD dapat diterbitkan langsung oleh rumah sakit tanpa menunggu rujukan dari FKTP",
  "Biaya ditanggung BPJS setelah verifikasi status kegawatdaruratan oleh dokter jaga IGD",
  "Jika kondisi terbukti tidak gawat darurat, pasien dikembalikan ke FKTP atau dikenakan biaya mandiri",
] as const;

function EmergencyInfoPanel() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <Siren size={14} className="text-amber-600" />
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-[11px] font-bold text-amber-800">
              Kasus Gawat Darurat — Rujukan Tidak Wajib
            </p>
            <p className="mt-0.5 text-[9.5px] text-amber-600">
              Perpres 82/2018 Pasal 47 · Permenkes 28/2014
            </p>
          </div>
          <ul className="space-y-1.5">
            {INFO_POINTS.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                <span className="text-[10px] leading-relaxed text-amber-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        checked ? "bg-sky-500" : "bg-slate-200",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-4.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

// ─── Compact rujukan row ──────────────────────────────────────

function RujukanRow({
  rujukan,
  selected,
  onClick,
}: {
  rujukan:  BpjsRujukanItem;
  selected: boolean;
  onClick:  () => void;
}) {
  const status = getRujukanStatus(rujukan.tglrujukan_awal, rujukan.tglrujukan_berakhir);
  const dotCls = {
    Aktif:           "bg-emerald-400",
    Kadaluarsa:      "bg-rose-400",
    "Belum Berlaku": "bg-amber-400",
  }[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border px-3 py-2 text-left transition-all duration-150",
        selected
          ? "border-sky-300 bg-sky-50 shadow-sm shadow-sky-100"
          : "border-transparent hover:border-slate-200 hover:bg-slate-50",
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotCls)} />
        <span className="flex-1 truncate font-mono text-[10px] font-bold text-slate-700">
          {rujukan.norujukan}
        </span>
        <span className="shrink-0 rounded bg-sky-50 px-1 py-0.5 font-mono text-[8.5px] font-bold text-sky-600">
          {rujukan.diagppk}
        </span>
        {selected && <CheckCircle2 size={10} className="shrink-0 text-sky-500" />}
      </div>
      <div className="mt-0.5 pl-3.5 text-[8.5px] text-slate-300">
        {getIcdName(rujukan.diagppk)} · {fmtDate(rujukan.tglrujukan_awal)} — {fmtDate(rujukan.tglrujukan_berakhir)}
      </div>
    </button>
  );
}

// ─── Pilih button footer ──────────────────────────────────────

function PilihFooter({
  rujukan,
  picked,
  onPilih,
}: {
  rujukan: BpjsRujukanItem;
  picked:  boolean;
  onPilih: () => void;
}) {
  const status  = getRujukanStatus(rujukan.tglrujukan_awal, rujukan.tglrujukan_berakhir);
  const isAktif = status === "Aktif";

  return (
    <AnimatePresence mode="wait">
      {picked ? (
        <motion.div
          key="picked"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2"
        >
          <CheckCircle2 size={11} className="shrink-0 text-emerald-500" />
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold text-emerald-700">Dipilih untuk SEP IGD</p>
            <p className="truncate font-mono text-[9px] text-emerald-500">{rujukan.norujukan}</p>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="btn"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          type="button"
          onClick={onPilih}
          disabled={!isAktif}
          title={!isAktif ? `Rujukan ${status} — tidak dapat dipilih` : undefined}
          className={cn(
            "w-full rounded-lg py-2 text-[11px] font-bold transition active:scale-95",
            isAktif
              ? "bg-sky-600 text-white hover:bg-sky-700"
              : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
        >
          {isAktif
            ? "Pilih Rujukan untuk SEP IGD"
            : `Tidak Dapat Dipilih — Rujukan ${status}`
          }
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── RujukanIGDPanel ──────────────────────────────────────────

export function RujukanIGDPanel({ noBpjs }: { noBpjs: string }) {
  const [hasRujukan,  setHasRujukan]  = useState(false);
  const [fetchState,  setFetchState]  = useState<FetchState>("idle");
  const [rujukanList, setRujukanList] = useState<BpjsRujukanItem[]>([]);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [pickedId,    setPickedId]    = useState<string | null>(null);

  const selectedRujukan = rujukanList.find(r => r.idrujukan === selectedId) ?? null;
  const isLoading       = fetchState === "loading";

  const handleToggle = () => {
    setHasRujukan(prev => !prev);
    if (hasRujukan) {
      setFetchState("idle");
      setRujukanList([]);
      setSelectedId(null);
      setPickedId(null);
    }
  };

  const handleFetch = () => {
    setFetchState("loading");
    setSelectedId(null);
    setPickedId(null);
    setTimeout(() => {
      setRujukanList(MOCK_RUJUKAN);
      setFetchState(MOCK_RUJUKAN.length > 0 ? "success" : "empty");
    }, 1000);
  };

  return (
    <div className="space-y-4">

      {/* Regulatory info */}
      <EmergencyInfoPanel />

      {/* Toggle: pasien membawa rujukan */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-700">
            Pasien membawa surat rujukan dari FKTP?
          </p>
          <p className="text-[10px] text-slate-400">
            Aktifkan untuk mencari dan memproses rujukan masuk pasien IGD
          </p>
        </div>
        <Toggle checked={hasRujukan} onChange={handleToggle} />
      </div>

      {/* Rujukan search area */}
      <AnimatePresence>
        {hasRujukan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={11} className="text-sky-400" />
                  <span className="font-mono text-[10px] text-slate-500">{noBpjs}</span>
                </div>
                <button
                  type="button"
                  onClick={handleFetch}
                  disabled={isLoading}
                  className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-sky-700 disabled:opacity-60"
                >
                  {isLoading
                    ? <RefreshCw size={9} className="animate-spin" />
                    : <Search size={9} />
                  }
                  {fetchState === "success" ? "Perbarui" : "Cari"}
                </button>
              </div>

              {/* List */}
              <div className="p-3">
                <AnimatePresence mode="wait">
                  {fetchState === "idle" && (
                    <motion.p
                      key="idle"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="py-4 text-center text-[10px] text-slate-300"
                    >
                      Klik <span className="font-semibold text-sky-500">Cari</span> untuk memuat data rujukan
                    </motion.p>
                  )}

                  {fetchState === "loading" && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="space-y-1 py-2"
                    >
                      {[0, 1].map(i => (
                        <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      ))}
                    </motion.div>
                  )}

                  {fetchState === "success" && (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="space-y-0.5"
                    >
                      {rujukanList.map((r, i) => (
                        <motion.div
                          key={r.idrujukan}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <RujukanRow
                            rujukan={r}
                            selected={selectedId === r.idrujukan}
                            onClick={() => {
                              setSelectedId(selectedId === r.idrujukan ? null : r.idrujukan);
                              setPickedId(null);
                            }}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {fetchState === "empty" && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-1.5 py-6"
                    >
                      <AlertTriangle size={14} className="text-slate-300" />
                      <p className="text-[10px] text-slate-400">Tidak ada rujukan ditemukan</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selected detail + pilih button */}
              <AnimatePresence>
                {selectedRujukan && (
                  <motion.div
                    key={selectedRujukan.idrujukan}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    <div className="space-y-3 p-3">
                      <RujukanCard rujukan={selectedRujukan} delay={0} />
                      <PilihFooter
                        rujukan={selectedRujukan}
                        picked={pickedId === selectedRujukan.idrujukan}
                        onPilih={() => setPickedId(selectedRujukan.idrujukan)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
