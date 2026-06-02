"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownToLine, Building2, Check, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { RujukanMasukPanel } from "@/components/registration/kunjungan/Tabs/rujukan/RujukanMasukPanel";
import { DiagnosaCombobox } from "@/components/registration/kunjungan/Tabs/rujukan/DiagnosaCombobox";
import {
  MOCK_SEP_RANAP, getIcdName,
  type BpjsRujukanItem, type IcdOption,
} from "@/components/registration/kunjungan/Tabs/rujukan/rujukanTypes";
import type { RujukanPick } from "./config";

type Mode = "masuk" | "kontrol";

const MODE_TABS: { id: Mode; label: string; icon: typeof ArrowDownToLine; desc: string }[] = [
  { id: "masuk", label: "Rujukan Masuk", icon: ArrowDownToLine, desc: "Cari rujukan FKTP via no. BPJS" },
  { id: "kontrol", label: "Kontrol Pasca Ranap", icon: Building2, desc: "Pakai No. SEP rawat inap terakhir" },
];

export function StepRujukan({
  noBpjs, rujukan, setRujukan,
}: {
  noBpjs: string;
  rujukan: RujukanPick;
  setRujukan: React.Dispatch<React.SetStateAction<RujukanPick>>;
}) {
  const [mode, setMode] = useState<Mode>(rujukan.source);

  function changeMode(m: Mode) {
    setMode(m);
    setRujukan({ source: m, noRujukan: "", diagnosa: null });
  }

  function pickMasuk(r: BpjsRujukanItem) {
    setRujukan({
      source: "masuk",
      noRujukan: r.norujukan,
      diagnosa: { code: r.diagppk, name: getIcdName(r.diagppk) },
    });
  }

  const picked = rujukan.noRujukan.length > 0 && rujukan.source === mode;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {MODE_TABS.map((t) => {
          const isActive = mode === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => changeMode(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all duration-150",
                isActive ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <t.icon size={12} className={isActive ? "text-sky-500" : "text-slate-400"} />
              {t.label}
            </button>
          );
        })}
      </div>
      <p className="-mt-2 px-1 text-[10px] text-slate-400">{MODE_TABS.find((t) => t.id === mode)?.desc}</p>

      {/* Selected summary — data inti: no. rujukan + diagnosa */}
      <AnimatePresence>
        {picked && rujukan.diagnosa && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <p className="text-[8.5px] font-bold uppercase tracking-wider text-emerald-600">No. Rujukan</p>
                  <p className="truncate font-mono text-[11px] font-bold text-slate-700">{rujukan.noRujukan}</p>
                </div>
                <div>
                  <p className="text-[8.5px] font-bold uppercase tracking-wider text-emerald-600">Diagnosa</p>
                  <p className="truncate text-[11px] font-semibold text-slate-700">
                    {rujukan.diagnosa.code} — {rujukan.diagnosa.name}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {mode === "masuk" ? (
            <RujukanMasukPanel noBpjs={noBpjs} onPick={pickMasuk} />
          ) : (
            <KontrolPicker rujukan={rujukan} setRujukan={setRujukan} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Kontrol pasca ranap — No. SEP terakhir dipakai sebagai No. Rujukan ──────────
function KontrolPicker({
  rujukan, setRujukan,
}: {
  rujukan: RujukanPick;
  setRujukan: React.Dispatch<React.SetStateAction<RujukanPick>>;
}) {
  const last = MOCK_SEP_RANAP;
  const [manual, setManual] = useState(false);
  const [noSEP, setNoSEP] = useState("");
  const [diagnosa, setDiagnosa] = useState<IcdOption | null>(
    () => ({ code: last.diagnosa, name: getIcdName(last.diagnosa) }),
  );

  const effectiveSEP = manual ? noSEP.trim() : last.noSEP;
  const ready = effectiveSEP.length >= 10 && diagnosa !== null;
  const committed = rujukan.source === "kontrol" && rujukan.noRujukan.length > 0;

  function gunakan() {
    if (!ready || !diagnosa) return;
    setRujukan({ source: "kontrol", noRujukan: effectiveSEP, diagnosa });
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* SEP terakhir */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          SEP Rawat Inap Terakhir <span className="font-normal normal-case text-slate-300">— jadi No. Rujukan kontrol</span>
        </p>
        {manual ? (
          <div className="space-y-1.5">
            <input
              type="text"
              value={noSEP}
              onChange={(e) => setNoSEP(e.target.value)}
              placeholder="Masukkan No. SEP rawat inap…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[12px] text-slate-800 placeholder:text-slate-300 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            <button type="button" onClick={() => { setManual(false); setNoSEP(""); }}
              className="text-[9.5px] text-slate-400 underline underline-offset-2 hover:text-slate-600">
              Gunakan SEP terakhir
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <div className="flex items-center gap-1.5">
              <FileText size={11} className="shrink-0 text-sky-400" />
              <span className="font-mono text-[11px] font-bold text-slate-700">{last.noSEP}</span>
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-x-3">
              {([["Diagnosa", `${last.diagnosa} — ${getIcdName(last.diagnosa)}`], ["Tgl Keluar", last.tglKeluar], ["Kelas", last.kelas]] as [string, string][]).map(
                ([k, v]) => (
                  <div key={k}>
                    <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{k}</p>
                    <p className="truncate text-[10px] font-medium text-slate-600">{v}</p>
                  </div>
                ),
              )}
            </div>
            <button type="button" onClick={() => setManual(true)}
              className="mt-2 text-[9.5px] text-slate-400 underline underline-offset-2 hover:text-slate-600">
              Input No. SEP lain
            </button>
          </div>
        )}
      </div>

      {/* Diagnosa */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Diagnosa <span className="font-normal normal-case text-slate-300">— ICD-10, wajib</span>
        </p>
        <DiagnosaCombobox value={diagnosa} onChange={setDiagnosa} />
      </div>

      {/* Commit */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <span className="text-[10px] text-slate-300">
          {!ready ? "Pilih No. SEP & diagnosa" : committed ? "Tersimpan sebagai rujukan" : ""}
        </span>
        <button
          type="button"
          onClick={gunakan}
          disabled={!ready}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] font-bold transition active:scale-95",
            ready ? "bg-sky-600 text-white hover:bg-sky-700" : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
        >
          {committed ? <><Check size={12} /> Digunakan</> : "Gunakan sebagai Rujukan"}
        </button>
      </div>
    </div>
  );
}
