"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Pencil, X, BadgeCheck, AlertCircle, Flag } from "lucide-react";
import type { CPPTEntry } from "@/lib/data";
import { cn } from "@/lib/utils";
import { fmtDate, PROFESI_CLS, SOAP_BADGE } from "./cpptShared";

// ── SOAPRow ───────────────────────────────────────────────

function SOAPRow({ letter, value }: { letter: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className={cn(
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold",
        SOAP_BADGE[letter] ?? "bg-slate-100 text-slate-500",
      )}>
        {letter}
      </span>
      <p className="flex-1 text-sm leading-relaxed text-slate-700 whitespace-pre-line">{value}</p>
    </div>
  );
}

// ── EntryCard ─────────────────────────────────────────────

export interface EntryCardProps {
  entry: CPPTEntry;
  editingId: string | null;
  onCopy: (e: CPPTEntry) => void;
  onEdit: (e: CPPTEntry) => void;
  onVerify: (id: string, verifiedBy: string, verifiedAt: string) => void;
  onFlag: (id: string) => void;
  requiresVerification: boolean;
  delay: number;
}

export default function CPPTEntryCard({
  entry, editingId, onCopy, onEdit, onVerify, onFlag, requiresVerification, delay,
}: EntryCardProps) {
  const [verifying, setVerifying]   = useState(false);
  const [verifyName, setVerifyName] = useState("");

  const isEditing = editingId === entry.id;
  const isFlagged = !!entry.flagged;

  const handleConfirmVerify = () => {
    const name = verifyName.trim();
    if (!name) return;
    const now  = new Date();
    const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const date = fmtDate(now.toISOString().split("T")[0]);
    onVerify(entry.id, name, `${date}, ${time}`);
    setVerifying(false);
    setVerifyName("");
  };

  return (
    <motion.article
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay, ease: "easeOut" }}
      className={cn(
        "mb-3 rounded-xl border bg-white shadow-sm transition",
        isEditing ? "border-amber-300 ring-2 ring-amber-100" :
        isFlagged ? "border-rose-200 ring-1 ring-rose-100"  :
                    "border-slate-200",
      )}
    >
      {/* ── Header ── */}
      <div className={cn(
        "flex flex-wrap items-center gap-2 border-b px-4 py-3",
        isEditing ? "border-amber-200 bg-amber-50/60" :
        isFlagged ? "border-rose-100 bg-rose-50/40"  :
                    "border-slate-100 bg-slate-50/60",
      )}>
        {isFlagged && (
          <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600">
            <Flag size={9} className="fill-rose-500 text-rose-500" />
            Tindak Lanjut
          </span>
        )}
        <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-600">
          {entry.waktu}
        </span>
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", PROFESI_CLS[entry.profesi])}>
          {entry.profesi}
        </span>
        <span className="text-sm text-slate-500">{entry.penulis}</span>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onFlag(entry.id)}
            title={isFlagged ? "Hapus flag tindak lanjut" : "Tandai tindak lanjut"}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md border transition",
              isFlagged
                ? "border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"
                : "border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500",
            )}
          >
            <Flag size={11} className={isFlagged ? "fill-rose-400" : ""} />
          </button>
          <button
            type="button"
            onClick={() => onCopy(entry)}
            title="Salin ke form baru"
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Copy size={11} /> Salin
          </button>
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition",
              isEditing
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600",
            )}
          >
            <Pencil size={11} /> Edit
          </button>
        </div>
      </div>

      {/* ── SOAP body ── */}
      <div className="flex flex-col gap-3 p-4">
        <SOAPRow letter="S" value={entry.subjektif} />
        <SOAPRow letter="O" value={entry.objektif} />
        <SOAPRow letter="A" value={entry.asesmen} />
        <SOAPRow letter="P" value={entry.planning} />
        <SOAPRow letter="I" value={entry.instruksi} />
      </div>

      {/* ── Verification footer (RI only) ── */}
      {requiresVerification && (
        <div className={cn(
          "rounded-b-xl border-t px-4 py-2.5",
          entry.verified ? "border-emerald-100 bg-emerald-50/50" : "border-slate-100 bg-slate-50/40",
        )}>
          {entry.verified ? (
            <div className="flex items-center gap-1.5">
              <BadgeCheck size={13} className="shrink-0 text-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-700">
                Diverifikasi DPJP oleh <strong>{entry.verifiedBy}</strong>
                <span className="mx-1 text-emerald-400">·</span>
                <span className="font-normal text-emerald-600">{entry.verifiedAt}</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600 ring-1 ring-amber-200">
                <AlertCircle size={10} className="shrink-0" />
                Belum Diverifikasi DPJP
              </span>
              {!verifying && (
                <button
                  type="button"
                  onClick={() => setVerifying(true)}
                  className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-600 transition hover:bg-indigo-100"
                >
                  <BadgeCheck size={11} /> Verifikasi DPJP
                </button>
              )}
            </div>
          )}

          <AnimatePresence>
            {verifying && !entry.verified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mt-2.5 flex items-center gap-2 border-t border-amber-100 pt-2.5">
                  <input
                    autoFocus
                    type="text"
                    value={verifyName}
                    onChange={(e) => setVerifyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConfirmVerify()}
                    placeholder="Nama dokter verifikator..."
                    className="h-8 flex-1 rounded-lg border border-indigo-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmVerify}
                    disabled={!verifyName.trim()}
                    className="flex h-8 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <BadgeCheck size={12} /> Konfirmasi
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVerifying(false); setVerifyName(""); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.article>
  );
}
