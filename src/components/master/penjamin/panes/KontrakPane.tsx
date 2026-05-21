"use client";

import { FileText, Calendar, Wallet, Coins } from "lucide-react";
import type { PenjaminRecord, PenjaminKontrak, SkemaPembayaran } from "@/lib/master/penjaminStore";
import {
  SKEMA_CFG, SKEMA_LIST, TARIF_GROUP_LIST,
  fmtRupiahShort, getKontrakStatus, fmtDate,
} from "../penjaminShared";
import { Field, TextInput, NumberInput, Select, SectionGroup } from "./FormPrimitives";

interface Props {
  draft: PenjaminRecord;
  onPatch: (p: Partial<PenjaminRecord>) => void;
}

function emptyKontrak(): PenjaminKontrak {
  return {
    noPKS: "",
    tanggalMulai: new Date().toISOString().slice(0, 10),
    tanggalAkhir: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    totalPlafon: 0,
    skemaPembayaran: "Fee_For_Service",
    tarifGroup: "Asuransi",
  };
}

export default function KontrakPane({ draft, onPatch }: Props) {
  const k = draft.kontrak;
  const status = getKontrakStatus(k?.tanggalAkhir);

  const patchKontrak = (p: Partial<PenjaminKontrak>) => {
    if (!k) return;
    onPatch({ kontrak: { ...k, ...p } });
  };

  // Empty state — tidak ada kontrak (mis. tipe Umum)
  if (!k) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          <FileText size={20} className="text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Belum ada kontrak PKS</p>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            Penjamin {draft.tipe === "Umum" ? "Umum biasanya tidak memerlukan PKS — pembayaran langsung pasien." : "ini belum memiliki perjanjian kerja sama. Tambahkan untuk mulai mengelola plafon, masa berlaku, dan skema pembayaran."}
          </p>
        </div>
        {draft.tipe !== "Umum" && (
          <button
            onClick={() => onPatch({ kontrak: emptyKontrak() })}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <FileText size={11} /> Tambah PKS
          </button>
        )}
      </div>
    );
  }

  // ── Tone untuk masa berlaku ──
  const toneCls = {
    valid:   { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" },
    soon:    { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-500"   },
    expired: { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200",    dot: "bg-rose-500"    },
  }[status.tone];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">

      {/* ── Form Kontrak ────────────────────────────────── */}
      <div className="space-y-4">

        <SectionGroup
          title="Identitas Kontrak / PKS"
          icon={FileText}
          accent={{ bg: "bg-emerald-50", text: "text-emerald-600" }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nomor PKS" required className="col-span-2">
              <TextInput
                value={k.noPKS}
                onChange={(v) => patchKontrak({ noPKS: v })}
                placeholder="PKS-XXX-2024-001"
                mono
              />
            </Field>

            <Field label="Tanggal Mulai">
              <input
                type="date"
                value={k.tanggalMulai}
                onChange={(e) => patchKontrak({ tanggalMulai: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </Field>

            <Field label="Tanggal Berakhir">
              <input
                type="date"
                value={k.tanggalAkhir}
                onChange={(e) => patchKontrak({ tanggalAkhir: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </Field>
          </div>
        </SectionGroup>

        <SectionGroup
          title="Plafon & Tarif"
          icon={Wallet}
          accent={{ bg: "bg-amber-50", text: "text-amber-600" }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Plafon" hint="Rp">
              <NumberInput
                value={k.totalPlafon}
                onChange={(v) => patchKontrak({ totalPlafon: v })}
                placeholder="0"
                prefix="Rp"
              />
            </Field>
            <Field label="Plafon / Klaim" hint="opsional">
              <NumberInput
                value={k.plafonPerKlaim ?? 0}
                onChange={(v) => patchKontrak({ plafonPerKlaim: v || undefined })}
                placeholder="0"
                prefix="Rp"
              />
            </Field>

            <Field label="Skema Pembayaran" className="col-span-2">
              <Select<SkemaPembayaran>
                value={k.skemaPembayaran}
                onChange={(v) => patchKontrak({ skemaPembayaran: v })}
                options={SKEMA_LIST.map((s) => ({ value: s, label: SKEMA_CFG[s].label }))}
              />
              <p className="mt-1 text-[10px] text-slate-500">
                {SKEMA_CFG[k.skemaPembayaran].desc}
              </p>
            </Field>

            <Field label="Grup Tarif" hint="referensi tarif" className="col-span-2">
              <div className="flex flex-wrap gap-1">
                {TARIF_GROUP_LIST.map((g) => {
                  const active = k.tarifGroup === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => patchKontrak({ tarifGroup: g })}
                      className={
                        active
                          ? "rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white"
                          : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                      }
                    >
                      Tarif {g}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </SectionGroup>

        <SectionGroup
          title="Syarat & Ketentuan"
          icon={FileText}
          accent={{ bg: "bg-slate-50", text: "text-slate-500" }}
        >
          <textarea
            value={k.termCondition ?? ""}
            onChange={(e) => patchKontrak({ termCondition: e.target.value || undefined })}
            placeholder="Term & condition khusus — mis. pre-authorization wajib > 10jt, klaim H+15, dst."
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </SectionGroup>
      </div>

      {/* ── Preview Card ──────────────────────────────────── */}
      <aside className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Status Kontrak</p>
            <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ring-1 ${toneCls.bg} ${toneCls.text} ${toneCls.ring}`}>
              <span className={`h-1 w-1 rounded-full ${toneCls.dot}`} />
              {status.label}
            </span>
          </div>
          <div className="space-y-2.5 px-3.5 py-3">
            <PreviewRow icon={Calendar} label="Periode">
              <p className="text-[11px] font-semibold text-slate-800">
                {fmtDate(k.tanggalMulai)} – {fmtDate(k.tanggalAkhir)}
              </p>
            </PreviewRow>

            <PreviewRow icon={Wallet} label="Plafon">
              <p className="text-sm font-black text-amber-700">
                Rp {fmtRupiahShort(k.totalPlafon)}
              </p>
              {k.plafonPerKlaim ? (
                <p className="text-[10px] text-slate-500">
                  per klaim: Rp {fmtRupiahShort(k.plafonPerKlaim)}
                </p>
              ) : null}
            </PreviewRow>

            <PreviewRow icon={Coins} label="Skema">
              <p className="text-[11px] font-semibold text-slate-800">{SKEMA_CFG[k.skemaPembayaran].label}</p>
              <p className="text-[10px] text-slate-500">Grup tarif: {k.tarifGroup}</p>
            </PreviewRow>
          </div>
        </div>

        <button
          onClick={() => onPatch({ kontrak: undefined })}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          Hapus Kontrak
        </button>
      </aside>
    </div>
  );
}

// ── PreviewRow ────────────────────────────────────────────

function PreviewRow({
  icon: Icon, label, children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100">
        <Icon size={11} className="text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        {children}
      </div>
    </div>
  );
}
