"use client";

// Cetak Label Obat & Etiket Aturan Pakai (Farmasi) — modal preview + print. Pola infra print
// global (`.print-area` isolasi · `.no-print` sembunyi toolbar) + injeksi @page dinamis agar
// pas di Kertas Thermal (58/80 mm roll) maupun A4. Petugas pilih ukuran sesuai printer.
// Etiket: putih = obat dalam/oral · biru = obat luar. Label: identitas pasien (SKP 1 dua
// penanda) + obat + peringatan HAM/LASA. Thermal = 1 kolom stack (gunting per kartu di roll).

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, AlertTriangle, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FarmasiOrder, FarmasiOrderItem } from "@/components/farmasi/farmasiShared";

const RS = { nama: "RS Harapan Sehat", alamat: "Jl. Kesehatan No. 1, Kota Sehat", telp: "(021) 123-4567" };

// ── Konfigurasi kertas ────────────────────────────────────
// `printW` = lebar konten print-area (mm) · `page` = @page size · `margin` = @page margin.
// Lebar mm dipakai langsung di layar (true-to-size preview) maupun saat cetak.

export type PaperSize = "t58" | "t80" | "A4";

const PAPER: Record<PaperSize, {
  label: string;
  printW: string;   // lebar konten (mm) — inline style print-area (layar + print)
  page: string;     // @page size
  margin: string;   // @page margin
  pad: string;      // padding print-area
  thermal: boolean;
}> = {
  t58: { label: "Thermal 58", printW: "54mm",  page: "58mm auto", margin: "2mm",       pad: "px-2 py-2",   thermal: true  },
  t80: { label: "Thermal 80", printW: "76mm",  page: "80mm auto", margin: "2mm",       pad: "px-2.5 py-2.5", thermal: true },
  A4:  { label: "A4",         printW: "190mm", page: "A4",        margin: "12mm 10mm", pad: "px-9 py-8",   thermal: false },
};

const PAPER_ORDER: PaperSize[] = ["t58", "t80", "A4"];

// ── Modal shell (generik) ─────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  defaultPaper?: PaperSize;
  children: (paper: PaperSize) => React.ReactNode;
}

function DokumenCetakModal({ open, onClose, title, subtitle, defaultPaper = "t80", children }: ModalProps) {
  const [paper, setPaper] = useState<PaperSize>(defaultPaper);
  const cfg = PAPER[paper];

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* @page dinamis — override margin/size global saat cetak (di DOM hanya saat modal terbuka). */}
          <style>{`@page { size: ${cfg.page}; margin: ${cfg.margin}; }`}</style>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="no-print fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[3px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-3 z-50 flex flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl ring-1 ring-slate-200 md:inset-6"
            role="dialog" aria-modal="true" aria-label={title}
          >
            <header className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 text-sky-700 ring-1 ring-sky-200">
                  <Printer size={14} />
                </span>
                <div>
                  <h2 className="text-[13px] font-semibold text-slate-800">{title}</h2>
                  <p className="text-[10.5px] text-slate-500">{subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Pemilih ukuran kertas */}
                <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 ring-1 ring-slate-200">
                  {PAPER_ORDER.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPaper(p)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-[10.5px] font-semibold transition-all",
                        paper === p ? "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700",
                      )}
                      title={`Ukuran ${PAPER[p].label}`}
                    >
                      {PAPER[p].label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setTimeout(() => window.print(), 60)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-[0.97]"
                  title="Cetak / simpan PDF"
                >
                  <Printer size={12} /> Cetak
                </button>
                <button
                  type="button" onClick={onClose} aria-label="Tutup"
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-auto bg-slate-200/60 px-3 py-5">
              <div
                className={cn("print-area mx-auto max-w-full bg-white shadow-sm", cfg.pad)}
                style={{ width: cfg.printW }}
                data-paper={paper}
              >
                {children(paper)}
              </div>
            </div>

            <footer className="no-print border-t border-slate-200 bg-white px-4 py-1.5 text-center text-[10px] text-slate-500">
              Pilih ukuran sesuai printer · pada dialog cetak set kertas/Paper size yang sama (mis. {cfg.label}) ·
              <kbd className="ml-1 rounded border border-slate-300 bg-slate-100 px-1 font-mono text-[9.5px]">Esc</kbd> untuk tutup
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Helpers ───────────────────────────────────────────────

function fmtTanggal(t: string): string {
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? t : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/** Obat luar (etiket biru) — topikal/tetes/rektal/inhalasi. Selain itu = obat dalam (putih). */
function isObatLuar(rute?: string): boolean {
  const r = (rute ?? "").toLowerCase();
  return /topikal|kulit|salep|krim|tetes|mata|telinga|hidung|rektal|vagina|supp|inhalasi|nebu|luar/.test(r);
}

function SheetHeader({ judul, thermal }: { judul: string; thermal: boolean }) {
  if (thermal) {
    return (
      <div className="mb-2 border-b border-dashed border-slate-300 pb-1.5 text-center">
        <p className="text-[11px] font-black leading-tight text-slate-900">{RS.nama}</p>
        <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-sky-700">{judul}</p>
      </div>
    );
  }
  return (
    <div className="mb-4 flex items-end justify-between border-b-2 border-sky-600 pb-2">
      <div>
        <p className="text-base font-black leading-tight text-slate-900">{RS.nama}</p>
        <p className="text-[10px] text-slate-500">{RS.alamat} · Telp. {RS.telp}</p>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-600">{judul}</p>
    </div>
  );
}

/** Garis gunting antar kartu (hanya mode thermal — petugas potong di roll). */
function CutLine() {
  return (
    <div className="flex items-center gap-1 text-slate-300" aria-hidden>
      <Scissors size={9} className="shrink-0" />
      <span className="flex-1 border-t border-dashed border-slate-300" />
    </div>
  );
}

/** Bungkus daftar kartu: A4 = grid 2 kolom · Thermal = 1 kolom stack + garis gunting. */
function CardList({ thermal, children }: { thermal: boolean; children: React.ReactNode[] }) {
  if (thermal) {
    return (
      <div className="flex flex-col gap-1.5">
        {children.map((c, i) => (
          <div key={i} className="break-inside-avoid">
            {i > 0 && <div className="pb-1.5"><CutLine /></div>}
            {c}
          </div>
        ))}
      </div>
    );
  }
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

// ── Etiket Aturan Pakai (per obat) ────────────────────────

export function EtiketSheet({ order, paper = "A4" }: { order: FarmasiOrder; paper?: PaperSize }) {
  const thermal = PAPER[paper].thermal;
  return (
    <div className="text-slate-900">
      <SheetHeader judul="Etiket Aturan Pakai" thermal={thermal} />
      <CardList thermal={thermal}>
        {order.items.map((it) => <EtiketCard key={it.id} order={order} item={it} thermal={thermal} />)}
      </CardList>
      {!thermal && (
        <p className="mt-4 text-center text-[9px] text-slate-400">
          Putih = obat dalam (oral) · Biru = obat luar · Gunting per kartu untuk ditempel pada kemasan obat.
        </p>
      )}
    </div>
  );
}

function EtiketCard({ order, item, thermal }: { order: FarmasiOrder; item: FarmasiOrderItem; thermal: boolean }) {
  const luar = isObatLuar(item.rute);
  return (
    <div className={cn(
      "flex flex-col rounded-lg border px-3 py-2.5",
      luar ? "border-sky-300 bg-sky-50" : "border-slate-300 bg-white",
    )}>
      <div className="flex items-start justify-between gap-2 border-b border-dashed border-slate-300 pb-1.5">
        <p className="text-[10px] font-bold text-slate-700">{RS.nama}</p>
        <div className="text-right">
          <p className="font-mono text-[9px] text-slate-500">No. {order.noOrder}</p>
          <p className="text-[9px] text-slate-500">{fmtTanggal(order.tanggal)}</p>
        </div>
      </div>

      <p className="mt-1.5 text-[11px]"><span className="text-slate-400">Nama: </span><span className="font-semibold text-slate-800">{order.namaPasien}</span></p>

      <p className={cn("mt-1 font-black leading-tight text-slate-900", thermal ? "text-[16px]" : "text-[15px]")}>{item.signa || item.dosis || "—"}</p>
      {item.aturanPakai && <p className="text-[11px] font-medium text-slate-600">{item.aturanPakai}</p>}

      <p className="mt-1.5 text-[11px] text-slate-700">
        <span className="font-bold">{item.namaObat}</span>
        {item.dosis ? ` · ${item.dosis}` : ""}
        <span className="text-slate-400"> · {item.jumlah} {item.satuanObat ?? "Tab"}</span>
      </p>

      <div className="mt-2 flex items-center justify-between border-t border-dashed border-slate-300 pt-1.5">
        {luar
          ? <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white">Obat Luar</span>
          : <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Obat Dalam</span>}
        <span className="text-[9px] italic text-slate-500">Semoga lekas sembuh</span>
      </div>
    </div>
  );
}

// ── Label Obat (identitas per obat) ───────────────────────

export function LabelSheet({ order, paper = "A4" }: { order: FarmasiOrder; paper?: PaperSize }) {
  const thermal = PAPER[paper].thermal;
  return (
    <div className="text-slate-900">
      <SheetHeader judul="Label Obat" thermal={thermal} />
      <CardList thermal={thermal}>
        {order.items.map((it) => <LabelCard key={it.id} order={order} item={it} />)}
      </CardList>
      {!thermal && (
        <p className="mt-4 text-center text-[9px] text-slate-400">
          Identitas pasien (2 penanda) + obat — SKP 1. Tempel pada wadah/kemasan saat penyiapan.
        </p>
      )}
    </div>
  );
}

function LabelCard({ order, item }: { order: FarmasiOrder; item: FarmasiOrderItem }) {
  return (
    <div className="flex flex-col rounded-lg border border-slate-300 bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold text-slate-700">{RS.nama} · {order.unit}</p>
        <p className="text-[9px] text-slate-500">{fmtTanggal(order.tanggal)}</p>
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2 border-y border-slate-100 py-1.5">
        <p className="text-[12px] font-black text-slate-900">{order.namaPasien}</p>
        <p className="font-mono text-[10px] text-slate-600">RM: {order.noRM}</p>
      </div>

      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className="text-[11px] font-bold text-slate-800">
          {item.namaObat}{item.dosis ? <span className="font-normal text-slate-500"> · {item.dosis}</span> : null}
        </p>
        <p className="shrink-0 text-[11px] font-bold tabular-nums text-slate-800">{item.jumlah} {item.satuanObat ?? "Tab"}</p>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="font-mono text-[9px] text-slate-400">No. {order.noOrder}</p>
        <div className="flex items-center gap-1">
          {item.isHAM && (
            <span className="inline-flex items-center gap-0.5 rounded bg-rose-600 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">
              <AlertTriangle size={8} /> HAM
            </span>
          )}
          {item.isLASA && (
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[8px] font-black uppercase text-amber-900">LASA</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal wrappers ────────────────────────────────────────

export function EtiketCetakModal({ open, onClose, order }: { open: boolean; onClose: () => void; order: FarmasiOrder }) {
  return (
    <DokumenCetakModal
      open={open} onClose={onClose}
      title="Etiket Aturan Pakai"
      subtitle={`Preview · ${order.namaPasien} · ${order.items.length} obat`}
    >
      {(paper) => <EtiketSheet order={order} paper={paper} />}
    </DokumenCetakModal>
  );
}

export function LabelCetakModal({ open, onClose, order }: { open: boolean; onClose: () => void; order: FarmasiOrder }) {
  return (
    <DokumenCetakModal
      open={open} onClose={onClose}
      title="Label Obat"
      subtitle={`Preview · ${order.namaPasien} · ${order.items.length} obat`}
    >
      {(paper) => <LabelSheet order={order} paper={paper} />}
    </DokumenCetakModal>
  );
}
