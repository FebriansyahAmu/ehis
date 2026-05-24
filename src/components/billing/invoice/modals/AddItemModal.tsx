"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { KATEGORI_CFG, KATEGORI_ORDER, fmtRupiah } from "../invoiceShared";
import type { KategoriCharge, ChargeItem, Coverage } from "../invoiceShared";

interface Props {
  open: boolean;
  defaultKategori?: KategoriCharge;
  onClose: () => void;
  onAdd: (item: Omit<ChargeItem, "id">) => void;
}

interface FormState {
  kategori: KategoriCharge;
  nama: string;
  qty: string;       // string untuk validasi user input
  satuan: string;
  hargaSatuan: string;
  coverage: Coverage;
  alasan: string;
}

const initialState = (kategori: KategoriCharge): FormState => ({
  kategori,
  nama: "",
  qty: "1",
  satuan: "pcs",
  hargaSatuan: "",
  coverage: "Pasien",
  alasan: "",
});

export default function AddItemModal({ open, defaultKategori = "Lain-lain", onClose, onAdd }: Props) {
  const [form, setForm] = useState<FormState>(() => initialState(defaultKategori));
  const [touched, setTouched] = useState(false);

  // Reset form saat modal ditutup atau kategori default berubah
  useEffect(() => {
    if (open) setForm(initialState(defaultKategori));
    if (!open) setTouched(false);
  }, [open, defaultKategori]);

  const qtyNum   = Number(form.qty);
  const hargaNum = Number(form.hargaSatuan.replace(/[^\d]/g, ""));
  const subtotal = (Number.isFinite(qtyNum) ? qtyNum : 0) * (Number.isFinite(hargaNum) ? hargaNum : 0);

  const errors = {
    nama: form.nama.trim() === "" ? "Nama item wajib diisi" : null,
    qty:  !Number.isFinite(qtyNum) || qtyNum <= 0 ? "Qty harus > 0" : null,
    harga: !Number.isFinite(hargaNum) || hargaNum <= 0 ? "Harga harus > 0" : null,
    alasan: form.kategori === "Lain-lain" && form.alasan.trim() === ""
      ? "Alasan wajib untuk item Lain-lain (audit trail)"
      : null,
  };
  const hasError = Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (hasError) return;
    onAdd({
      tanggalISO: new Date().toISOString().slice(0, 16),
      nama: form.nama.trim(),
      sourceModul: "Adjustment",
      sourceRef: `MANUAL-${Date.now()}`,
      kategori: form.kategori,
      qty: qtyNum,
      satuan: form.satuan.trim() || "pcs",
      hargaSatuan: hargaNum,
      coverage: form.coverage,
      alasanDiskon: form.alasan.trim() || undefined,
    });
    onClose();
  };

  // ESC close
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <ModalShell title="Tambah Item Manual" onClose={onClose}>
          <div className="space-y-3">
            {/* Kategori */}
            <Field label="Kategori">
              <select
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value as KategoriCharge })}
                className={selectCn}
              >
                {KATEGORI_ORDER.map((k) => (
                  <option key={k} value={k}>{KATEGORI_CFG[k].label}</option>
                ))}
              </select>
            </Field>

            {/* Nama */}
            <Field label="Nama Item" error={touched ? errors.nama : null}>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="mis. Konsultasi tambahan"
                className={inputCn}
              />
            </Field>

            {/* Qty + satuan */}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Qty" error={touched ? errors.qty : null}>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  className={inputCn}
                />
              </Field>
              <Field label="Satuan">
                <input
                  type="text"
                  value={form.satuan}
                  onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                  placeholder="pcs / kali / hari"
                  className={inputCn}
                />
              </Field>
            </div>

            {/* Harga + coverage */}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Harga Satuan (Rp)" error={touched ? errors.harga : null}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.hargaSatuan}
                  onChange={(e) => setForm({ ...form, hargaSatuan: e.target.value.replace(/[^\d]/g, "") })}
                  placeholder="150000"
                  className={cn(inputCn, "font-mono tabular-nums")}
                />
              </Field>
              <Field label="Coverage">
                <select
                  value={form.coverage}
                  onChange={(e) => setForm({ ...form, coverage: e.target.value as Coverage })}
                  className={selectCn}
                >
                  <option value="Pasien">Pasien</option>
                  <option value="Penjamin">Penjamin</option>
                  <option value="Mixed">Split / Mixed</option>
                </select>
              </Field>
            </div>

            {/* Alasan (wajib jika Lain-lain) */}
            <Field
              label={form.kategori === "Lain-lain" ? "Alasan (wajib)" : "Alasan (opsional)"}
              error={touched ? errors.alasan : null}
            >
              <textarea
                rows={2}
                value={form.alasan}
                onChange={(e) => setForm({ ...form, alasan: e.target.value })}
                placeholder="Audit trail — alasan penambahan item manual"
                className={cn(inputCn, "resize-none")}
              />
            </Field>

            {/* Preview subtotal */}
            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500 dark:text-slate-400">Subtotal preview</span>
                <span className="font-mono text-[14px] font-bold tabular-nums text-amber-700 dark:text-amber-400">
                  {fmtRupiah(subtotal)}
                </span>
              </div>
            </div>
          </div>

          <ModalFooter
            onClose={onClose}
            onConfirm={submit}
            confirmLabel="Tambah Item"
            confirmIcon={Plus}
          />
        </ModalShell>
      )}
    </AnimatePresence>
  );
}

// ── Shared modal pieces (used by all 3 modals) ──────────

export const inputCn =
  "w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export const selectCn = cn(inputCn, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[position:right_8px_center] bg-[length:12px] bg-no-repeat pr-7");

export function ModalShell({
  title, onClose, children, maxWidth = "max-w-md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
      />
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800",
          maxWidth,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h2 id="modal-title" className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={14} />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
          {children}
        </div>
      </motion.div>
    </>
  );
}

export function Field({
  label, error, children,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-rose-600">
          <AlertCircle size={11} />
          {error}
        </span>
      )}
    </label>
  );
}

export function ModalFooter({
  onClose, onConfirm, confirmLabel, confirmIcon: Icon, danger,
}: {
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmIcon: React.ComponentType<{ size?: number; className?: string }>;
  danger?: boolean;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
      <button
        type="button"
        onClick={onClose}
        className="rounded-md px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Batal
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all active:scale-[0.97]",
          danger ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700",
        )}
      >
        <Icon size={12} />
        {confirmLabel}
      </button>
    </div>
  );
}
