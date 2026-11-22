"use client";

// Kartu satu catatan CPPT di riwayat. Garis aksen kiri = jenis (SOAP/SBAR/TBAK); kartu yang baru
// disimpan disorot sebentar. Verifikasi DPJP:
//   mode DB    → verifikator = akun login (server) → cukup konfirmasi "Verifikasi sebagai <nama>".
//   mode demo  → ketik nama verifikator.
// TBAK yang belum diverifikasi > 1×24 jam ditandai merah (SKP 2).

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, BadgeCheck, Check, Clock, Copy, Flag, Pencil, Phone, Trash2, X } from "lucide-react";
import type { CPPTEntry, CPPTJenis } from "@/lib/data";
import { cn } from "@/lib/ui/utils";
import {
  CPPT_JENIS_META, PROFESI_CLS, TBAK_STEPS, areasFor, fmtDate, tbakOverdue, todayISO, type CPPTAreaDef,
} from "./cpptShared";

function AreaRow({ area, value }: { area: CPPTAreaDef; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="flex gap-3">
      <dt className="shrink-0">
        <span className={cn("mt-0.5 flex size-5 items-center justify-center rounded-md text-[11px] font-bold", area.badgeCls)}>
          <span aria-hidden="true">{area.badge}</span>
          <span className="sr-only">{area.label}</span>
        </span>
      </dt>
      <dd className="min-w-0 flex-1 text-sm leading-relaxed whitespace-pre-line text-slate-700 wrap-anywhere">{value}</dd>
    </div>
  );
}

function TbakBody({ entry }: { entry: CPPTEntry }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 m-tiny font-semibold text-rose-800 ring-1 ring-rose-200">
          {entry.tbakMetode === "Telepon" && <Phone className="size-3" aria-hidden="true" />}
          {entry.tbakMetode ?? "Verbal"}
        </span>
        {entry.tbakPemberi && (
          <span className="m-xs text-slate-600">
            Pemberi instruksi: <strong className="font-semibold text-slate-800">{entry.tbakPemberi}</strong>
          </span>
        )}
      </div>
      {entry.instruksi && (
        <dl>
          <AreaRow area={{ key: "instruksi", badge: "I", label: "Instruksi", placeholder: "", badgeCls: "bg-rose-100 text-rose-800" }} value={entry.instruksi} />
        </dl>
      )}
      <ul className="flex flex-wrap gap-1.5" aria-label="Langkah Tulis–Baca–Konfirmasi">
        {TBAK_STEPS.map((s) => {
          const done = !!entry[s.key];
          return (
            <li
              key={s.key}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 m-tiny font-semibold ring-1",
                done ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-50 text-slate-500 ring-slate-200",
              )}
            >
              {done ? <Check className="size-3" strokeWidth={3} aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
              {s.label}
              <span className="sr-only">{done ? " (sudah)" : " (belum)"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const ICON_BTN = cn(
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 m-tiny font-medium text-slate-600 transition",
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600",
);

export interface EntryCardProps {
  entry: CPPTEntry;
  isEditing: boolean;
  /** Sorot sebentar (baru disimpan / diperbarui). */
  flash?: boolean;
  onCopy: (e: CPPTEntry) => void;
  onEdit: (e: CPPTEntry) => void;
  onVerify: (id: string, verifiedBy: string, verifiedAt: string) => void;
  onFlag: (id: string) => void;
  onDelete: (e: CPPTEntry) => void;
  /** Hapus hanya milik sendiri / Admin (server menegakkan; ini sembunyikan tombol). */
  canDelete: boolean;
  requiresVerification: boolean;
  /** Mode DB: nama akun login yang akan tercatat sebagai verifikator. null = mode demo (ketik nama). */
  serverVerifier: string | null | undefined;
  delay?: number;
}

export default function CPPTEntryCard({
  entry, isEditing, flash, onCopy, onEdit, onVerify, onFlag, onDelete, canDelete, requiresVerification, serverVerifier, delay = 0,
}: EntryCardProps) {
  const [verifying, setVerifying] = useState(false);
  const [verifyName, setVerifyName] = useState("");

  const isFlagged = !!entry.flagged;
  const jenis: CPPTJenis = entry.jenisCatatan ?? "SOAP";
  const meta = CPPT_JENIS_META[jenis];
  const serverMode = serverVerifier !== undefined;
  // Mode DB: server yang menentukan (verified undefined = tak perlu co-sign → verifikasi ditolak server).
  const showVerify = serverMode ? entry.verified !== undefined : requiresVerification || jenis === "TBAK";
  const overdue = jenis === "TBAK" && !entry.verified && tbakOverdue(entry.tanggal, entry.waktu);

  const confirmVerify = () => {
    if (serverMode) {
      onVerify(entry.id, serverVerifier ?? "", "");
      setVerifying(false);
      return;
    }
    const name = verifyName.trim();
    if (!name) return;
    const now = new Date();
    const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    onVerify(entry.id, name, `${fmtDate(todayISO())}, ${time}`);
    setVerifying(false);
    setVerifyName("");
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay, ease: "easeOut" }}
      aria-label={`${meta.label} ${entry.waktu} oleh ${entry.penulis}`}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white shadow-xs transition-[border-color,box-shadow] duration-500",
        isEditing ? "border-amber-300 ring-2 ring-amber-100"
          : flash ? "border-emerald-300 ring-2 ring-emerald-200"
          : isFlagged ? "border-rose-200 ring-1 ring-rose-100"
          : "border-slate-200",
      )}
    >
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", meta.bar)} />

      {/* ── Kepala ── */}
      <header className="flex flex-wrap items-start gap-x-3 gap-y-2 py-2.5 pr-3 pl-4 sm:pl-5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <time className="rounded-md bg-slate-100 px-2 py-0.5 font-mono m-xs font-semibold tabular-nums text-slate-700">{entry.waktu}</time>
          <span className={cn("rounded-md px-2 py-0.5 m-tiny font-semibold", PROFESI_CLS[entry.profesi])}>{entry.profesi}</span>
          <span className={cn("rounded-md px-2 py-0.5 m-tiny font-bold", meta.chip)} title={meta.ket}>{meta.label}</span>
          {isFlagged && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 m-mini font-bold uppercase tracking-wide text-rose-700">
              <Flag className="size-2.5 fill-rose-600 text-rose-600" aria-hidden="true" />
              Tindak lanjut
            </span>
          )}
          {isEditing && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 m-mini font-bold uppercase tracking-wide text-amber-800">Sedang diedit</span>
          )}
          <span className="w-full truncate m-xs text-slate-600 sm:w-auto sm:flex-1">{entry.penulis}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onFlag(entry.id)}
            aria-pressed={isFlagged}
            aria-label="Tandai tindak lanjut"
            title={isFlagged ? "Hapus tanda tindak lanjut" : "Tandai tindak lanjut"}
            className={cn(ICON_BTN, "w-8 px-0", isFlagged ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" : "hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600")}
          >
            <Flag className={cn("size-3.5", isFlagged && "fill-rose-500")} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onCopy(entry)}
            title="Salin isi ke form catatan baru"
            className={cn(ICON_BTN, "hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700")}
          >
            <Copy className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Salin</span>
            <span className="sr-only sm:hidden">Salin</span>
          </button>
          <button
            type="button"
            onClick={() => onEdit(entry)}
            aria-pressed={isEditing}
            className={cn(ICON_BTN, isEditing ? "border-amber-400 bg-amber-50 text-amber-800" : "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800")}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Edit</span>
            <span className="sr-only sm:hidden">Edit</span>
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(entry)}
              aria-label="Hapus catatan"
              title="Hapus catatan"
              className={cn(ICON_BTN, "w-8 px-0 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700")}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* ── Isi ── */}
      <div className="border-t border-slate-100 py-3 pr-4 pl-4 sm:pl-5">
        {jenis === "TBAK" ? (
          <TbakBody entry={entry} />
        ) : (
          <dl className="flex flex-col gap-2.5">
            {areasFor(jenis).map((a) => <AreaRow key={a.key} area={a} value={entry[a.key]} />)}
          </dl>
        )}
      </div>

      {/* ── Verifikasi DPJP ── */}
      {showVerify && (
        <div
          className={cn(
            "border-t py-2.5 pr-4 pl-4 sm:pl-5",
            entry.verified ? "border-emerald-100 bg-emerald-50/50"
              : overdue ? "border-rose-100 bg-rose-50/50"
              : "border-slate-100 bg-slate-50/50",
          )}
        >
          {entry.verified ? (
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 m-xs text-emerald-800">
              <BadgeCheck className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
              Diverifikasi DPJP oleh <strong className="font-semibold">{entry.verifiedBy}</strong>
              {entry.verifiedAt && <span className="text-emerald-700">· {entry.verifiedAt}</span>}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 m-tiny font-semibold ring-1",
                  overdue ? "bg-rose-50 text-rose-800 ring-rose-200" : "bg-amber-50 text-amber-800 ring-amber-200",
                )}
              >
                {overdue ? <Clock className="size-3" aria-hidden="true" /> : <AlertCircle className="size-3" aria-hidden="true" />}
                {overdue ? "Lewat 1×24 jam — belum diverifikasi DPJP" : "Menunggu verifikasi DPJP"}
              </span>
              {!verifying && (
                <button
                  type="button"
                  onClick={() => setVerifying(true)}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 m-tiny font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
                >
                  <BadgeCheck className="size-3.5" aria-hidden="true" /> Verifikasi
                </button>
              )}
            </div>
          )}

          <AnimatePresence initial={false}>
            {verifying && !entry.verified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-2.5">
                  {serverMode ? (
                    <p className="min-w-0 flex-1 m-xs text-slate-700">
                      Verifikasi sebagai <strong className="font-semibold">{serverVerifier || "akun Anda"}</strong>?
                    </p>
                  ) : (
                    <input
                      autoFocus
                      type="text"
                      value={verifyName}
                      onChange={(e) => setVerifyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); confirmVerify(); }
                      }}
                      aria-label="Nama dokter verifikator"
                      placeholder="Nama dokter verifikator"
                      className="h-8 min-w-40 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-500/15"
                    />
                  )}
                  <button
                    type="button"
                    onClick={confirmVerify}
                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-indigo-600 px-3 m-xs font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <BadgeCheck className="size-3.5" aria-hidden="true" /> Konfirmasi
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVerifying(false); setVerifyName(""); }}
                    className="inline-flex h-8 items-center rounded-lg px-2.5 m-xs font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-500"
                  >
                    Batal
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
