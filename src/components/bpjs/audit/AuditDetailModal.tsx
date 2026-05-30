"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckCircle2, XCircle, Clock, User, Shield,
  Hash, RotateCw, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BPJSAuditEntry } from "@/lib/bpjs/bpjsShared";
import { BPJS_RETRYABLE_CODES, BPJS_CODE_MESSAGES } from "@/lib/bpjs/bpjsShared";
import { bpjsToast } from "@/lib/bpjs/bpjsToastStore";

// ── Helpers ───────────────────────────────────────────────

const METHOD_CLS: Record<string, string> = {
  GET:    "bg-sky-100 text-sky-700",
  POST:   "bg-emerald-100 text-emerald-700",
  PUT:    "bg-amber-100 text-amber-700",
  DELETE: "bg-rose-100 text-rose-700",
};

const CODE_CLS: Record<string, string> = {
  "200": "bg-emerald-100 text-emerald-700",
  "201": "bg-slate-100 text-slate-600",
  "202": "bg-amber-100 text-amber-700",
  "203": "bg-amber-100 text-amber-700",
  "204": "bg-amber-100 text-amber-700",
  "500": "bg-rose-100 text-rose-700",
  "503": "bg-rose-100 text-rose-700",
};

function fmtTs(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[32px] items-start gap-3 border-b border-slate-100 py-2.5 last:border-0">
      <span className="w-36 shrink-0 text-[11px] font-medium text-slate-500">{label}</span>
      <div className="min-w-0 flex-1 text-[12px] text-slate-800">{children}</div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────

export interface AuditDetailModalProps {
  open: boolean;
  entry: BPJSAuditEntry | null;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────

export default function AuditDetailModal({ open, entry, onClose }: AuditDetailModalProps) {
  const isRetryable = entry
    ? BPJS_RETRYABLE_CODES.has(entry.responseCode as Parameters<typeof BPJS_RETRYABLE_CODES["has"]>[0])
    : false;

  function handleRetry() {
    if (!entry) return;
    bpjsToast.info(
      "Retry dikirim",
      `${entry.method} ${entry.endpoint} · idempotencyKey: ${entry.idempotencyKey ?? "—"}`,
    );
    onClose();
  }

  return (
    <>
      {open && entry && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      {open && entry && (
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                {entry.success ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <XCircle size={18} className="text-rose-500" />
                )}
                <div>
                  <p className="text-sm font-bold text-slate-800">Detail Audit Entry</p>
                  <p className="font-mono text-[10px] text-slate-400">{entry.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Status banner */}
              <div className={cn(
                "mb-4 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12px] font-semibold",
                entry.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700",
              )}>
                {entry.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {entry.success ? "Berhasil" : "Gagal"}
                {entry.errorType && (
                  <span className="ml-auto flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-0.5 text-[11px] text-rose-600">
                    <AlertTriangle size={11} />
                    {entry.errorType}
                  </span>
                )}
              </div>

              {/* Fields */}
              <div className="divide-y divide-slate-50 rounded-xl border border-slate-100 bg-slate-50/50 px-4">
                <Row label="Waktu">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Clock size={11} className="text-slate-400" />
                    {fmtTs(entry.timestamp)}
                  </span>
                </Row>
                <Row label="Endpoint">
                  <span className="break-all font-mono text-[11px] text-sky-700">
                    {entry.endpoint}
                  </span>
                </Row>
                <Row label="Method + Kode">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-md px-2 py-0.5 font-mono text-xs font-bold", METHOD_CLS[entry.method] ?? "bg-slate-100 text-slate-600")}>
                      {entry.method}
                    </span>
                    <span className={cn("rounded-md px-2 py-0.5 font-mono text-xs font-bold", CODE_CLS[entry.responseCode] ?? "bg-slate-100 text-slate-600")}>
                      {entry.responseCode}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {BPJS_CODE_MESSAGES[entry.responseCode as keyof typeof BPJS_CODE_MESSAGES] ?? "—"}
                    </span>
                  </div>
                </Row>
                <Row label="Durasi">
                  <span className="font-mono text-[12px]">{entry.durationMs.toLocaleString("id-ID")} ms</span>
                </Row>
                <Row label="Aktor">
                  <span className="flex items-center gap-1.5">
                    <User size={11} className="text-slate-400" />
                    {entry.actor}
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {entry.actorRole}
                    </span>
                  </span>
                </Row>
                <Row label="Cons ID">
                  <span className="flex items-center gap-1.5">
                    <Shield size={11} className="text-slate-400" />
                    <span className="font-mono text-[11px]">{entry.consId}</span>
                  </span>
                </Row>
                {entry.idempotencyKey && (
                  <Row label="Idempotency Key">
                    <span className="break-all font-mono text-[10px] text-violet-700">
                      {entry.idempotencyKey}
                    </span>
                    {(entry.retryCount ?? 0) > 0 && (
                      <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        Retry #{entry.retryCount}
                      </span>
                    )}
                  </Row>
                )}
                <Row label="Request Hash">
                  <span className="flex items-center gap-1.5">
                    <Hash size={10} className="text-slate-400" />
                    <span className="break-all font-mono text-[9px] text-slate-500">
                      {entry.requestHash}
                    </span>
                  </span>
                </Row>
                {entry.responseHash && (
                  <Row label="Response Hash">
                    <span className="break-all font-mono text-[9px] text-slate-500">
                      {entry.responseHash}
                    </span>
                  </Row>
                )}
              </div>

              {/* Stack trace mock jika error */}
              {!entry.success && (
                <div className="mt-4">
                  <p className="mb-1.5 text-[11px] font-semibold text-rose-600">Stack Trace</p>
                  <pre className="overflow-x-auto rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 font-mono text-[10px] leading-relaxed text-rose-700">
{`BPJSAdapterError: ${entry.errorType ?? "UNKNOWN_ERROR"}
  at simulateAdapter (vClaimAdapter.ts:88:13)
  at async fetchWrapper (bpjsShared.ts:142:5)
  at async ${entry.endpoint.split("/")[1] ?? "handler"}.ts:34:9

Response: { metaData: { code: "${entry.responseCode}", message: "${BPJS_CODE_MESSAGES[entry.responseCode as keyof typeof BPJS_CODE_MESSAGES] ?? "Unknown"}" } }
Timestamp: ${entry.timestamp}
ConsId: ${entry.consId}`}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-[10px] text-slate-400">
                UU PDP 27/2022 — hash disimpan bukan plaintext
              </p>
              <div className="flex items-center gap-2">
                {isRetryable && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    <RotateCw size={12} />
                    Retry Request
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
