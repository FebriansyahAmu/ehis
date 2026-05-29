"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, Loader2, Search, ExternalLink, CheckCircle,
  AlertCircle, FileText, Cpu,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getSEP } from "@/lib/bpjs/vClaimSEP";
import { CLAIM_BOARD_MOCK } from "@/lib/eklaim/claimsMock";
import type { SEPRecordExt, BPJSError } from "@/lib/bpjs/bpjsShared";
import type { ClaimRecord } from "@/lib/eklaim/eklaimShared";
import { statusChipCls, fmtTgl } from "./sepShared";

// ── Helpers ────────────────────────────────────────────────

function errMsg(e: BPJSError): string {
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Terjadi kesalahan.";
}

function findClaimBySEP(noSEP: string): ClaimRecord | undefined {
  return CLAIM_BOARD_MOCK.find((c) => c.penjamin.sep?.noSEP === noSEP);
}

function fmtRupiah(n: bigint | undefined): string {
  if (n === undefined) return "—";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n));
}

function grouperLabel(era: ClaimRecord["eraGrouper"]): string {
  return era === "iDRG" ? "iDRG (2025+)" : "INA-CBG Legacy";
}

function grouperCode(claim: ClaimRecord): string {
  if (claim.iDRG?.code) return claim.iDRG.code;
  if (claim.inaCbgLegacy?.code) return claim.inaCbgLegacy.code;
  return "—";
}

// ── Claim summary ──────────────────────────────────────────

function ClaimFound({ claim, sep }: { claim: ClaimRecord; sep: SEPRecordExt }) {
  const code    = grouperCode(claim);
  const isIDRG  = claim.eraGrouper === "iDRG";
  const selisih = claim.selisih;
  const klaimUrl = `/ehis-eklaim/klaim/${claim.id}`;

  return (
    <motion.div
      key="claim-found"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3.5 p-5"
    >
      {/* Header */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <CheckCircle size={16} className="text-emerald-600" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-emerald-700">Klaim Ditemukan di E-Klaim</p>
          <p className="mt-0.5 font-mono text-[11px] text-emerald-600">{claim.noKlaim}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Pasien: <span className="font-semibold text-slate-700">{claim.pasienId}</span>
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", statusChipCls(sep.statusInternal))}>
          SEP {sep.statusInternal}
        </span>
      </div>

      {/* Grouper + Diagnosa */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Cpu size={12} className={isIDRG ? "text-violet-500" : "text-slate-400"} strokeWidth={2.3} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grouper</p>
          </div>
          <p className={cn("text-xs font-semibold", isIDRG ? "text-violet-700" : "text-slate-600")}>
            {grouperLabel(claim.eraGrouper)}
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-slate-800">{code}</p>
          {claim.iDRG?.severity && (
            <p className="mt-0.5 text-[10px] text-slate-400">Severity {claim.iDRG.severity.level} · {claim.iDRG.severity.label}</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <FileText size={12} className="text-slate-400" strokeWidth={2.3} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnosa Primer</p>
          </div>
          <p className="font-mono text-sm font-bold text-slate-800">{claim.diagnosaPrimer.kode}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">{claim.diagnosaPrimer.deskripsi}</p>
        </div>
      </div>

      {/* Tarif */}
      <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tarif & Selisih</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <TarifCell label="Tarif RS" value={fmtRupiah(claim.tarifRS)} />
          <TarifCell label="Approved" value={fmtRupiah(claim.approvedAmount)} accent="emerald" />
          <TarifCell
            label="Selisih"
            value={selisih !== undefined ? fmtRupiah(selisih) : "—"}
            accent={selisih !== undefined ? (selisih >= 0n ? "emerald" : "rose") : undefined}
          />
        </div>
      </div>

      {/* Status klaim */}
      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-2.5">
        <p className="text-xs text-slate-500">
          Status: <span className="font-semibold text-slate-700">{claim.statusPenjamin}</span>
        </p>
        <p className="text-xs text-slate-400">{fmtTgl(claim.createdAt.slice(0, 10))}</p>
      </div>

      {/* CTA */}
      <a
        href={klaimUrl}
        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200/60 transition-all hover:bg-emerald-600 hover:shadow-md hover:shadow-emerald-300/40"
      >
        <ExternalLink size={13} strokeWidth={2.3} />
        Buka di E-Klaim
      </a>
    </motion.div>
  );
}

function TarifCell({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "rose" }) {
  return (
    <div className={cn(
      "rounded-lg p-2",
      accent === "emerald" ? "bg-emerald-50" : accent === "rose" ? "bg-rose-50" : "bg-slate-50",
    )}>
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={cn(
        "mt-0.5 text-xs font-semibold leading-tight",
        accent === "emerald" ? "text-emerald-700" : accent === "rose" ? "text-rose-600" : "text-slate-700",
      )}>
        {value}
      </p>
    </div>
  );
}

// ── No claim state ─────────────────────────────────────────

function ClaimNotFound({ sep }: { sep: SEPRecordExt }) {
  const klaimBaru = `/ehis-eklaim/klaim/baru?noSEP=${encodeURIComponent(sep.noSEP)}&diagAwal=${encodeURIComponent(sep.diagAwal)}&noKartu=${encodeURIComponent(sep.noKartu)}`;

  return (
    <motion.div
      key="no-claim"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3.5 p-5"
    >
      {/* SEP summary */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SEP</p>
        <p className="mt-0.5 break-all font-mono text-sm font-bold text-slate-800">{sep.noSEP}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", statusChipCls(sep.statusInternal))}>
            {sep.statusInternal}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
            {sep.diagAwal}
          </span>
          <span className="text-[10px] text-slate-400">{fmtTgl(sep.tglTerbit)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2.5 rounded-xl bg-amber-50/70 px-3.5 py-3 ring-1 ring-amber-100">
        <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-500" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-amber-700">
          SEP ini belum memiliki klaim di modul E-Klaim. Buat klaim baru untuk memulai proses grouping iDRG dan pengajuan ke BPJS.
        </p>
      </div>

      {/* CTA */}
      <a
        href={klaimBaru}
        className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white shadow-sm shadow-violet-200/60 transition-all hover:bg-violet-700"
      >
        <Link2 size={13} strokeWidth={2.3} />
        Buat Klaim Baru di E-Klaim
      </a>

      <p className="text-center text-[10px] text-slate-400">
        Data SEP (noKartu · diagAwal) akan di-pre-fill otomatis
      </p>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────

type IntState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; sep: SEPRecordExt; claim: ClaimRecord }
  | { status: "no-claim"; sep: SEPRecordExt }
  | { status: "error"; msg: string };

export default function SEPIntegrasiInaCBGCard() {
  const inputId = useId();
  const [noSEP, setNoSEP]   = useState("");
  const [touched, setTouched] = useState(false);
  const [state, setState]   = useState<IntState>({ status: "idle" });

  const inputErr = touched && noSEP.trim().length < 5 ? "No. SEP minimal 5 karakter" : null;

  async function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    setTouched(true);
    if (inputErr || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await getSEP(noSEP.trim());
      if (!res.ok) { setState({ status: "error", msg: errMsg(res.error) }); return; }
      const sep = res.value.response;
      if (!sep) { setState({ status: "error", msg: "SEP tidak ditemukan" }); return; }
      const claim = findClaimBySEP(sep.noSEP);
      if (claim) {
        setState({ status: "found", sep, claim });
      } else {
        setState({ status: "no-claim", sep });
      }
    } catch {
      setState({ status: "error", msg: "Koneksi ke V-Claim gagal." });
    }
  }

  return (
    <div className="flex flex-col gap-4 p-5">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Link2 size={13} className="text-violet-500" strokeWidth={2.3} />
        <p className="text-xs font-semibold text-slate-700">Integrasi SEP ↔ E-Klaim (iDRG / INA-CBG)</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="sr-only">Nomor SEP</label>
          <input
            id={inputId}
            type="text"
            value={noSEP}
            onChange={(e) => setNoSEP(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="SEP-2026-0501-00012"
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm text-slate-800 placeholder:font-sans placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2",
              inputErr
                ? "border-rose-300 bg-rose-50/30 focus:ring-rose-100"
                : "border-slate-200 bg-white focus:border-violet-300 focus:ring-violet-100",
            )}
          />
          <AnimatePresence mode="wait">
            {inputErr && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
                className="mt-1 text-xs font-medium text-rose-500"
              >
                {inputErr}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-violet-200/50 transition-all hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
        >
          {state.status === "loading"
            ? <Loader2 size={13} className="animate-spin" />
            : <Search size={13} strokeWidth={2.5} />
          }
          Cari
        </button>
      </form>

      {/* Result */}
      <AnimatePresence mode="wait">
        {state.status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-8 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 ring-1 ring-violet-100">
              <Link2 size={22} className="text-violet-200" strokeWidth={1.5} />
            </div>
            <p className="max-w-[180px] text-xs leading-relaxed text-slate-400">
              Cari SEP untuk cek apakah sudah ada klaim di modul E-Klaim
            </p>
          </motion.div>
        )}

        {state.status === "error" && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-200"
          >
            {state.msg}
          </motion.p>
        )}

        {state.status === "found"    && <ClaimFound    key="found"    claim={state.claim} sep={state.sep} />}
        {state.status === "no-claim" && <ClaimNotFound key="no-claim" sep={state.sep} />}
      </AnimatePresence>
    </div>
  );
}
