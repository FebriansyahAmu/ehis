"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Printer,
  Info,
  ClipboardList,
  Receipt,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster, BillingRecord } from "@/lib/data";
import { UNIT_CFG, TAGIHAN_STATUS, calcKasir, fmtRp } from "./config";

interface PatientLeftPanelProps {
  patient: PatientMaster;
  photoRef: React.RefObject<HTMLInputElement | null>;
  onInfoLengkap: () => void;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function PatientLeftPanel({
  patient,
  photoRef,
  onInfoLengkap,
}: PatientLeftPanelProps) {
  const kasirCalc = useMemo(
    () => (patient.kasir ? calcKasir(patient.kasir) : null),
    [patient.kasir],
  );
  const totalDeposit = patient.kasir?.deposits.reduce((s, d) => s + d.jumlah, 0) ?? 0;

  // Rincian tagihan = ranah modul Billing. Kartu ini INFO ringkas saja; baris men-deep-link ke
  // detail tagihan per kunjungan di /ehis-billing.
  const kidByNoKunjungan = useMemo(() => {
    const m = new Map<string, string>();
    for (const k of patient.riwayatKunjungan) m.set(k.noKunjungan, k.id);
    return m;
  }, [patient.riwayatKunjungan]);
  const billingHref = (b: BillingRecord): string => {
    // Record NYATA (listPatientBilling): id = kunjunganId (UUID) → deep-link langsung.
    if (UUID_RE.test(b.id)) return `/ehis-billing/tagihan/kunjungan/${b.id}`;
    // Demo/mock: coba resolusi UUID dari riwayat via noKunjungan; else board Billing.
    const kid = kidByNoKunjungan.get(b.noKunjungan);
    return kid && UUID_RE.test(kid)
      ? `/ehis-billing/tagihan/kunjungan/${kid}`
      : "/ehis-billing/tagihan";
  };

  // Tagihan terbaru dulu (tanggal "YYYY-MM-DD" → urut leksikal desc). Server sudah urut, tapi
  // di-sort ulang agar konsisten juga untuk pasien demo/mock.
  const sortedBilling = useMemo(
    () => [...patient.billing].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [patient.billing],
  );

  // Paginasi kartu: 4 baris/halaman, sisanya lewat kontrol prev/next (kolom kiri sempit).
  const BILL_PAGE = 4;
  const [billPage, setBillPage] = useState(1);
  const billTotalPages = Math.max(1, Math.ceil(sortedBilling.length / BILL_PAGE));
  // Reset ke halaman 1 saat daftar berubah (pola adjust-state-during-render, bukan effect).
  const billKey = `${patient.id}|${sortedBilling.length}`;
  const [prevBillKey, setPrevBillKey] = useState(billKey);
  if (billKey !== prevBillKey) { setPrevBillKey(billKey); setBillPage(1); }
  const billSafePage = Math.min(billPage, billTotalPages);
  const billStart = (billSafePage - 1) * BILL_PAGE;
  const pagedBilling = sortedBilling.slice(billStart, billStart + BILL_PAGE);

  // Data-only (tanpa closure pembaca-ref di dalam array yang di-render). Ref dibaca dalam
  // arrow onClick inline di JSX → konteks event handler (lolos react-hooks/refs).
  const quickActions = [
    { key: "info",  icon: Info,          label: "Info Pasien" },
    { key: "rm",    icon: ClipboardList, label: "Rekam Medis" },
    { key: "cetak", icon: Printer,       label: "Cetak Kartu" },
    { key: "foto",  icon: Camera,        label: "Ubah Foto" },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Aksi Cepat ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold text-slate-800">Aksi Cepat</p>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                onClick={() => {
                  if (a.key === "info") onInfoLengkap();
                  else if (a.key === "cetak") window.print();
                  else if (a.key === "foto") photoRef.current?.click();
                  // "rm": placeholder Rekam Medis (belum di-wire)
                }}
                className="group flex cursor-pointer flex-col items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50 active:scale-[0.97]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-100 transition group-hover:text-sky-600 group-hover:ring-sky-200">
                  <Icon size={14} />
                </span>
                <span className="text-[11px] font-semibold text-slate-600 transition group-hover:text-sky-700">
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tagihan (read-only ringkasan — aksi pembayaran di /ehis-billing) ── */}
      {patient.billing.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <Receipt size={13} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Rincian Tagihan</span>
              <span
                title="Tampilan ringkasan. Pembayaran dikelola di modul Billing Kasir."
                className="rounded-full bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200"
              >
                Read-only
              </span>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {patient.billing.length} tagihan
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {pagedBilling.map((b) => {
              const uc = UNIT_CFG[b.unit];
              const UIcon = uc.icon;
              return (
                <Link
                  key={b.id}
                  href={billingHref(b)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka rincian tagihan di modul Billing"
                  className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50/70"
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", uc.bg)}>
                    <UIcon size={14} className={uc.text} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-700">{b.unit}</p>
                    <p className="truncate font-mono text-[9px] text-slate-400">{b.noKunjungan}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-black text-slate-900">{fmtRp(b.totalBiaya)}</p>
                    <span
                      className={cn(
                        "text-[9px] font-semibold leading-tight",
                        (TAGIHAN_STATUS[b.status] ?? "").split(" ").find((c) => c.startsWith("text-")) ?? "text-slate-500",
                      )}
                    >
                      {b.status}
                    </span>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition group-hover:border-teal-300 group-hover:bg-teal-50 group-hover:text-teal-600">
                    <ExternalLink size={12} />
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Paginasi (muncul bila > 4 tagihan) */}
          {billTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2">
              <span className="text-[10px] tabular-nums text-slate-500">
                {billStart + 1}–{billStart + pagedBilling.length}
                <span className="text-slate-400"> dari {sortedBilling.length}</span>
              </span>
              <div className="flex items-center gap-1">
                <BillPageBtn
                  label="Halaman sebelumnya"
                  disabled={billSafePage <= 1}
                  onClick={() => setBillPage(billSafePage - 1)}
                >
                  <ChevronLeft size={12} />
                </BillPageBtn>
                <span className="min-w-9 text-center font-mono text-[10px] tabular-nums text-slate-600">
                  {billSafePage}/{billTotalPages}
                </span>
                <BillPageBtn
                  label="Halaman berikutnya"
                  disabled={billSafePage >= billTotalPages}
                  onClick={() => setBillPage(billSafePage + 1)}
                >
                  <ChevronRight size={12} />
                </BillPageBtn>
              </div>
            </div>
          )}

          {((kasirCalc?.sisaBayar ?? 0) > 0 || totalDeposit > 0) && (
            <div className="space-y-1 border-t border-slate-100 bg-slate-50 px-4 py-3">
              {kasirCalc && kasirCalc.sisaBayar > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-rose-500">Sisa Bayar Aktif</span>
                  <span className="font-bold text-rose-600">{fmtRp(kasirCalc.sisaBayar)}</span>
                </div>
              )}
              {totalDeposit > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-500">Deposit</span>
                  <span className="font-semibold text-emerald-600">{fmtRp(totalDeposit)}</span>
                </div>
              )}
            </div>
          )}
          {/* ── Deep-link CTA: aksi pembayaran via /ehis-billing ── */}
          <div className="border-t border-slate-100 bg-amber-50/40 px-3 py-2.5">
            <Link
              href="/ehis-billing/tagihan"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-[11px] font-semibold text-amber-700 shadow-xs transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
            >
              <span className="flex items-center gap-1.5">
                <Receipt size={11} className="text-amber-500" />
                Buka di Billing Kasir
              </span>
              <ExternalLink size={11} className="text-amber-400 transition group-hover:translate-x-0.5 group-hover:text-amber-600" />
            </Link>
            <p className="mt-1.5 px-0.5 text-[9.5px] leading-tight text-slate-400">
              Pembayaran, deposit, refund, dan cetak kwitansi dikelola di modul Billing.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50">
            <Receipt size={20} className="text-slate-300" />
          </span>
          <p className="text-xs font-medium text-slate-500">Belum ada tagihan</p>
          <p className="text-[10px] text-slate-400">Tagihan muncul setelah ada kunjungan berbiaya.</p>
        </div>
      )}
    </div>
  );
}

// ── Tombol paginasi kartu Tagihan ───────────────────────
function BillPageBtn({
  children, label, disabled, onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-md ring-1 transition-all duration-150",
        disabled
          ? "cursor-not-allowed text-slate-300 ring-slate-200"
          : "text-slate-600 ring-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:ring-teal-300 active:scale-90",
      )}
    >
      {children}
    </button>
  );
}
