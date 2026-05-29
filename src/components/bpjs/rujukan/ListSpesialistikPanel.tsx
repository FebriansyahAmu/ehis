"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { listSpesialistik, type SpesialistikRefRecord } from "@/lib/bpjs/vClaimRujukan";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Gagal memuat data.";
}

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; list: SpesialistikRefRecord[] }
  | { status: "error"; msg: string };

export default function ListSpesialistikPanel() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    listSpesialistik()
      .then((res) => {
        if (!res.ok) { setState({ status: "error", msg: errMsg(res.error) }); return; }
        setState({ status: "loaded", list: res.value.response ?? [] });
      })
      .catch(() => setState({ status: "error", msg: "Koneksi ke V-Claim gagal." }));
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <p className="text-[10px] text-slate-400">
          Referensi master spesialistik V-Claim · di-cache 24 jam
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {state.status === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400"
            >
              <Loader2 size={13} className="animate-spin text-teal-400" />
              Memuat referensi spesialistik…
            </motion.div>
          )}

          {state.status === "error" && (
            <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="m-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
            >{state.msg}</motion.p>
          )}

          {state.status === "loaded" && (
            <motion.div key="loaded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="w-10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">No.</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Kode</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Spesialistik</th>
                  </tr>
                </thead>
                <tbody>
                  {state.list.map((item, i) => (
                    <motion.tr
                      key={item.kdSpesialis}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.14, delay: i * 0.03 }}
                      className="border-b border-slate-50 last:border-0 transition-colors hover:bg-teal-50/20"
                    >
                      <td className="py-2.5 pl-4 text-[11px] text-slate-400">{i + 1}</td>
                      <td className="py-2.5 pl-4 pr-3">
                        <span className="rounded-lg bg-teal-50 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-700 ring-1 ring-teal-200/60">
                          {item.kdSpesialis}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-700">{item.nmSpesialis}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {state.status === "loaded" && (
        <div className="shrink-0 border-t border-slate-100 bg-teal-50/60 px-4 py-2">
          <p className="text-[10px] font-medium text-teal-700">
            {state.status === "loaded" ? state.list.length : 0} spesialistik · referensi V-Claim
          </p>
        </div>
      )}
    </div>
  );
}
