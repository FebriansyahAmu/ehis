"use client";

import { useState, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listSarana, type SaranaRefRecord } from "@/lib/bpjs/vClaimRujukan";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Gagal memuat data.";
}

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; list: SaranaRefRecord[]; query: string; jenis: "FKTP" | "FKRTL" }
  | { status: "error"; msg: string };

function FaskesToggle({
  value,
  onChange,
}: {
  value: "FKTP" | "FKRTL";
  onChange: (v: "FKTP" | "FKRTL") => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {(["FKTP", "FKRTL"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all",
            value === opt
              ? "bg-white text-teal-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function ListSaranaPanel() {
  const inputId = useId();
  const [jenisFaskes, setJenisFaskes] = useState<"FKTP" | "FKRTL">("FKTP");
  const [nama, setNama] = useState("");
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const handleSearch = useCallback(
    async (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      if (state.status === "loading") return;
      setState({ status: "loading" });
      try {
        const res = await listSarana(nama.trim(), jenisFaskes);
        if (!res.ok) { setState({ status: "error", msg: errMsg(res.error) }); return; }
        const list = res.value.response ?? [];
        setState({ status: "loaded", list, query: nama.trim(), jenis: jenisFaskes });
      } catch {
        setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
      }
    },
    [nama, jenisFaskes, state.status],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Filter */}
      <div className="shrink-0 space-y-2 border-b border-slate-100 px-4 py-3">
        <FaskesToggle
          value={jenisFaskes}
          onChange={(v) => { setJenisFaskes(v); setState({ status: "idle" }); }}
        />
        <form onSubmit={handleSearch} className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">Nama faskes</label>
          <input
            id={inputId}
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Cari nama faskes… (kosongkan = semua)"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-300 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
          <button
            type="submit"
            disabled={state.status === "loading"}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-teal-200/50 transition-all hover:bg-teal-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
          >
            {state.status === "loading"
              ? <Loader2 size={11} className="animate-spin" />
              : <Search size={11} strokeWidth={2.5} />
            }
            Cari
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {state.status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 py-10 text-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 ring-1 ring-teal-100">
                <Building2 size={18} className="text-teal-200" strokeWidth={1.5} />
              </div>
              <p className="text-xs text-slate-400">Pilih jenis faskes dan klik Cari</p>
              <p className="text-[10px] text-slate-300">Kosongkan nama untuk tampilkan semua</p>
            </motion.div>
          )}

          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400"
            >
              <Loader2 size={13} className="animate-spin text-teal-400" />
              Memuat data faskes…
            </motion.div>
          )}

          {state.status === "error" && (
            <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="m-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
            >{state.msg}</motion.p>
          )}

          {state.status === "loaded" && (
            <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {state.list.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-xs text-slate-400">
                    Tidak ada faskes {state.jenis}{state.query ? ` bernama "${state.query}"` : ""}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-120 text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        {["Kode", "Nama Faskes", "Alamat", "Jenis"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.list.map((item, i) => (
                        <motion.tr
                          key={item.kdFaskes}
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.14, delay: i * 0.04 }}
                          className="border-b border-slate-50 last:border-0 transition-colors hover:bg-teal-50/20"
                        >
                          <td className="py-2.5 pl-4 pr-3 font-mono text-[10px] font-semibold text-slate-600">
                            {item.kdFaskes}
                          </td>
                          <td className="py-2.5 pr-3 text-xs font-semibold text-slate-800">
                            {item.nmFaskes}
                          </td>
                          <td className="py-2.5 pr-3 text-[11px] text-slate-500">
                            {item.alamat ?? "—"}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              item.jenis === "FKTP"
                                ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200/60"
                                : "bg-violet-50 text-violet-700 ring-1 ring-violet-200/60",
                            )}>
                              {item.jenis}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {state.status === "loaded" && state.list.length > 0 && (
        <div className="shrink-0 border-t border-slate-100 bg-teal-50/60 px-4 py-2">
          <p className="text-[10px] font-medium text-teal-700">
            {state.list.length} faskes · {state.list[0]?.jenis}
          </p>
        </div>
      )}
    </div>
  );
}
