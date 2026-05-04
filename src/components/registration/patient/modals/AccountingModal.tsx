"use client";

import { useState, useMemo } from "react";
import {
  Receipt,
  FileText,
  Calculator,
  Wallet,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KasirData, PatientMaster, KategoriItem, MetodeBayar, DepositRecord } from "@/lib/data";
import { ModalShell } from "../primitives";
import { KATEGORI_CFG, TAGIHAN_STATUS, fmtRp, calcKasir } from "../config";

type AccTab = "ringkasan" | "rincian" | "kasir" | "deposit";

const TABS: { id: AccTab; label: string; icon: typeof Receipt }[] = [
  { id: "ringkasan", label: "Ringkasan", icon: Receipt },
  { id: "rincian", label: "Rincian Tagihan", icon: FileText },
  { id: "kasir", label: "Kasir / Bayar", icon: Calculator },
  { id: "deposit", label: "Deposit", icon: Wallet },
];

const METODE_OPTS: MetodeBayar[] = ["Tunai", "Transfer", "QRIS", "BPJS", "Asuransi"];

export function AccountingModal({
  kasir,
  patient,
  onClose,
}: {
  kasir: KasirData;
  patient: PatientMaster;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<AccTab>("ringkasan");
  const [uang, setUang] = useState("");
  const [metode, setMetode] = useState<MetodeBayar>("Tunai");
  const [expandedKat, setExpandedKat] = useState<KategoriItem | null>(null);
  const [localDeposits, setLocalDeposits] = useState<DepositRecord[]>(kasir.deposits);
  const [showAddDeposit, setShowAddDeposit] = useState(false);
  const [newDep, setNewDep] = useState<Partial<DepositRecord>>({
    metode: "Tunai",
    tanggal: "14 Apr 2026",
    waktu: "",
    jumlah: 0,
    kasir: "",
  });

  const {
    totalTagihan,
    totalDeposit: _baseDeposit,
    byKategori,
  } = useMemo(() => calcKasir(kasir), [kasir]);
  const totalDeposit = localDeposits.reduce((s, d) => s + d.jumlah, 0);
  const sisaBayar = Math.max(0, totalTagihan - totalDeposit);
  const uangNum = parseFloat(uang.replace(/[^0-9]/g, "")) || 0;
  const kembalian = uangNum > sisaBayar ? uangNum - sisaBayar : 0;
  const kurang = uangNum > 0 && uangNum < sisaBayar ? sisaBayar - uangNum : 0;
  const kategoris = Object.keys(byKategori) as KategoriItem[];

  return (
    <ModalShell
      title={`Kasir — ${patient.name}`}
      subtitle={`${kasir.noTagihan} · ${kasir.noKunjungan} · ${kasir.tanggal}`}
      onClose={onClose}
      size="xl"
    >
      {/* Tab bar */}
      <div className="flex shrink-0 gap-0.5 border-b border-slate-100 bg-slate-50 px-4 pt-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-t-lg border border-b-0 px-3.5 py-2 text-xs font-semibold transition",
              tab === id
                ? "border-slate-200 bg-white text-indigo-600 shadow-xs"
                : "border-transparent text-slate-400 hover:text-slate-600",
            )}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="flex-1 overflow-y-auto">
        {/* RINGKASAN */}
        {tab === "ringkasan" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tagihan</p>
                <p className="mt-1 text-lg font-black text-slate-900">{fmtRp(totalTagihan)}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Total Deposit</p>
                <p className="mt-1 text-lg font-black text-emerald-700">{fmtRp(totalDeposit)}</p>
              </div>
              <div
                className={cn(
                  "rounded-xl border p-4 text-center",
                  sisaBayar > 0 ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50",
                )}
              >
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", sisaBayar > 0 ? "text-rose-500" : "text-emerald-500")}>
                  Sisa Bayar
                </p>
                <p className={cn("mt-1 text-lg font-black", sisaBayar > 0 ? "text-rose-700" : "text-emerald-700")}>
                  {fmtRp(sisaBayar)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-xs font-semibold text-slate-600">Rincian per Kategori</p>
              </div>
              <div className="divide-y divide-slate-50">
                {kategoris.map((kat) => {
                  const cfg = KATEGORI_CFG[kat];
                  const KIcon = cfg.icon;
                  return (
                    <div key={kat} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex h-6 w-6 items-center justify-center rounded-md border text-[10px]", cfg.bg)}>
                          <KIcon size={11} className={cfg.color} />
                        </span>
                        <span className="text-xs font-medium text-slate-600">{kat}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{fmtRp(byKategori[kat] ?? 0)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold text-slate-700">Grand Total</span>
                <span className="text-sm font-black text-slate-900">{fmtRp(totalTagihan)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-xs text-slate-500">Status Pembayaran</span>
              <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", TAGIHAN_STATUS[kasir.statusPembayaran])}>
                {kasir.statusPembayaran}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-xs text-slate-500">Penjamin</span>
              <span className="text-xs font-semibold text-slate-700">{kasir.penjamin}</span>
            </div>
          </div>
        )}

        {/* RINCIAN */}
        {tab === "rincian" && (
          <div className="p-5 space-y-3">
            {kategoris.map((kat) => {
              const cfg = KATEGORI_CFG[kat];
              const KIcon = cfg.icon;
              const items = kasir.items.filter((i) => i.kategori === kat);
              const sub = items.reduce((s, i) => s + i.qty * i.harga, 0);
              const open = expandedKat === kat;
              return (
                <div key={kat} className={cn("overflow-hidden rounded-xl border", cfg.bg.split(" ")[1])}>
                  <button
                    onClick={() => setExpandedKat(open ? null : kat)}
                    className="flex w-full cursor-pointer items-center justify-between px-4 py-3 hover:bg-white/50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", cfg.bg)}>
                        <KIcon size={13} className={cfg.color} />
                      </span>
                      <span className={cn("text-xs font-bold", cfg.color)}>{kat}</span>
                      <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                        {items.length} item
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{fmtRp(sub)}</span>
                      {open ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                    </div>
                  </button>
                  {open && (
                    <div className="border-t border-white/60 bg-white/70 px-4 py-2">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-2 text-left">Nama Item</th>
                            <th className="pb-2 text-center">Qty</th>
                            <th className="pb-2 text-center">Satuan</th>
                            <th className="pb-2 text-right">Harga</th>
                            <th className="pb-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-1.5 font-medium text-slate-700">{item.nama}</td>
                              <td className="py-1.5 text-center text-slate-500">{item.qty}</td>
                              <td className="py-1.5 text-center text-slate-400">{item.satuan}</td>
                              <td className="py-1.5 text-right text-slate-500">{fmtRp(item.harga)}</td>
                              <td className="py-1.5 text-right font-semibold text-slate-800">{fmtRp(item.qty * item.harga)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200">
                            <td colSpan={4} className="pt-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Subtotal {kat}
                            </td>
                            <td className="pt-2 text-right text-xs font-bold text-slate-900">{fmtRp(sub)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex items-center justify-between rounded-xl border-2 border-slate-300 bg-white px-4 py-3">
              <span className="text-sm font-bold text-slate-700">GRAND TOTAL</span>
              <span className="text-base font-black text-slate-900">{fmtRp(totalTagihan)}</span>
            </div>
          </div>
        )}

        {/* KASIR / BAYAR */}
        {tab === "kasir" && (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rincian Pembayaran</p>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="divide-y divide-slate-50">
                  {kategoris.map((kat) => (
                    <div key={kat} className="flex justify-between px-4 py-2 text-xs">
                      <span className="text-slate-500">{kat}</span>
                      <span className="font-medium text-slate-700">{fmtRp(byKategori[kat] ?? 0)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
                  <span className="font-bold text-slate-700">Total Tagihan</span>
                  <span className="font-bold text-slate-900">{fmtRp(totalTagihan)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 px-4 py-2 text-xs">
                  <span className="text-emerald-600">Deposit Diterima</span>
                  <span className="font-semibold text-emerald-700">({fmtRp(totalDeposit)})</span>
                </div>
                <div
                  className={cn(
                    "flex justify-between border-t px-4 py-3",
                    sisaBayar > 0 ? "border-rose-100 bg-rose-50" : "border-emerald-100 bg-emerald-50",
                  )}
                >
                  <span className={cn("text-sm font-black", sisaBayar > 0 ? "text-rose-700" : "text-emerald-700")}>
                    SISA BAYAR
                  </span>
                  <span className={cn("text-sm font-black", sisaBayar > 0 ? "text-rose-800" : "text-emerald-800")}>
                    {fmtRp(sisaBayar)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Metode Pembayaran</p>
              <div className="grid grid-cols-3 gap-2">
                {METODE_OPTS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetode(m)}
                    className={cn(
                      "cursor-pointer rounded-lg border py-2 text-xs font-semibold transition",
                      metode === m
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Uang Diterima
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    value={uang}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setUang(raw ? new Intl.NumberFormat("id-ID").format(parseInt(raw)) : "");
                    }}
                    placeholder="0"
                    className="w-full rounded-xl border-2 border-slate-200 bg-white pl-10 pr-4 py-3 text-right text-xl font-black text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div
                className={cn(
                  "rounded-xl border-2 p-4 text-center",
                  uangNum === 0
                    ? "border-slate-200 bg-slate-50"
                    : kembalian > 0
                      ? "border-emerald-300 bg-emerald-50"
                      : kurang > 0
                        ? "border-rose-300 bg-rose-50"
                        : "border-emerald-300 bg-emerald-50",
                )}
              >
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    uangNum === 0 ? "text-slate-400" : kembalian > 0 ? "text-emerald-500" : kurang > 0 ? "text-rose-500" : "text-emerald-500",
                  )}
                >
                  {uangNum === 0 ? "Kembalian" : kembalian > 0 ? "Kembalian" : kurang > 0 ? "Kekurangan" : "Pas / Lunas"}
                </p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-black",
                    uangNum === 0 ? "text-slate-300" : kembalian > 0 ? "text-emerald-700" : kurang > 0 ? "text-rose-700" : "text-emerald-700",
                  )}
                >
                  {uangNum === 0 ? fmtRp(0) : kembalian > 0 ? fmtRp(kembalian) : kurang > 0 ? fmtRp(kurang) : "Lunas ✓"}
                </p>
              </div>

              <button
                disabled={(uangNum < sisaBayar && uangNum > 0) || uangNum === 0}
                className="w-full cursor-pointer rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Proses Pembayaran
              </button>
            </div>
          </div>
        )}

        {/* DEPOSIT */}
        {tab === "deposit" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Total Deposit</p>
                <p className="mt-1 text-base font-black text-emerald-700">{fmtRp(totalDeposit)}</p>
              </div>
              <div
                className={cn(
                  "rounded-xl border p-3 text-center",
                  sisaBayar > 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50",
                )}
              >
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", sisaBayar > 0 ? "text-rose-500" : "text-slate-400")}>
                  Hutang / Sisa
                </p>
                <p className={cn("mt-1 text-base font-black", sisaBayar > 0 ? "text-rose-700" : "text-slate-400")}>
                  {fmtRp(sisaBayar)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tagihan</p>
                <p className="mt-1 text-base font-black text-slate-700">{fmtRp(totalTagihan)}</p>
              </div>
            </div>

            <div className="space-y-2">
              {localDeposits.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">Belum ada deposit.</p>
              )}
              {localDeposits.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-start justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-emerald-800">{fmtRp(dep.jumlah)}</p>
                    <p className="mt-0.5 text-[11px] text-emerald-600">
                      {dep.tanggal} {dep.waktu} · <span className="font-medium">{dep.metode}</span>
                    </p>
                    {dep.keterangan && (
                      <p className="mt-0.5 text-[11px] text-emerald-500">{dep.keterangan}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-emerald-400">Kasir: {dep.kasir}</p>
                  </div>
                  <span className="rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                    {dep.metode}
                  </span>
                </div>
              ))}
            </div>

            {showAddDeposit ? (
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Tambah Deposit Baru</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "tanggal" as const, label: "Tanggal" },
                    { key: "waktu" as const, label: "Waktu" },
                    { key: "kasir" as const, label: "Nama Kasir" },
                    { key: "keterangan" as const, label: "Keterangan" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
                      <input
                        value={(newDep[key] ?? "") as string}
                        onChange={(e) => setNewDep((x) => ({ ...x, [key]: e.target.value }))}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Jumlah (Rp)</label>
                  <input
                    type="number"
                    value={newDep.jumlah || ""}
                    onChange={(e) => setNewDep((x) => ({ ...x, jumlah: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Metode</p>
                  <div className="flex gap-2 flex-wrap">
                    {METODE_OPTS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setNewDep((x) => ({ ...x, metode: m }))}
                        className={cn(
                          "cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                          newDep.metode === m
                            ? "border-indigo-500 bg-indigo-600 text-white"
                            : "border-slate-200 bg-white text-slate-600",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddDeposit(false)}
                    className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (!newDep.jumlah || !newDep.kasir) return;
                      const record: DepositRecord = {
                        id: `dp-${Date.now()}`,
                        tanggal: newDep.tanggal || "",
                        waktu: newDep.waktu || "",
                        jumlah: newDep.jumlah,
                        metode: newDep.metode as MetodeBayar,
                        keterangan: newDep.keterangan,
                        kasir: newDep.kasir,
                      };
                      setLocalDeposits((prev) => [...prev, record]);
                      setNewDep({ metode: "Tunai", tanggal: "", waktu: "", jumlah: 0, kasir: "" });
                      setShowAddDeposit(false);
                    }}
                    className="flex-1 cursor-pointer rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                  >
                    Simpan Deposit
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddDeposit(true)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 py-3 text-xs font-semibold text-emerald-600 transition hover:border-emerald-400 hover:bg-emerald-100"
              >
                <Plus size={13} /> Tambah Deposit Baru
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
        <div className="text-xs text-slate-400">
          Sisa bayar:{" "}
          <strong className={cn(sisaBayar > 0 ? "text-rose-600" : "text-emerald-600")}>
            {fmtRp(sisaBayar)}
          </strong>
        </div>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Tutup
        </button>
      </div>
    </ModalShell>
  );
}
