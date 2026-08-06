"use client";

// Logo RS — unggah / ganti / hapus logo (data URI base64). Logo tersimpan di DB
// (master.RsProfil.logoDataUrl) dan OTOMATIS tampil di KOP semua cetakan surat EHIS
// (surat sakit/sehat, resume, SEP, rujukan, invoice, e-klaim, …) via useRsProfil().
//
// Raster (png/jpeg/webp) di-downscale ke ≤512px sisi terpanjang di klien (canvas) agar
// payload kecil & konsisten; SVG dibiarkan (vektor). Batas efektif ±500KB terenkode.

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, Trash2, Loader2, ImageOff, Building2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_BYTES   = 500 * 1024;     // batas file mentah
const MAX_DIM     = 512;            // sisi terpanjang setelah downscale
const MAX_ENCODED = 680_000;        // batas panjang data URI (selaras server)

interface Props {
  logo:     string | null;
  nama:     string;
  kode:     string;
  busy:     boolean;
  onUpload: (dataUrl: string) => Promise<void>;
  onRemove: () => Promise<void>;
}

/** Baca file → data URL. Raster di-downscale via canvas; SVG apa adanya. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca berkas."));
    reader.onload = () => {
      const raw = reader.result as string;
      if (file.type === "image/svg+xml") return resolve(raw); // vektor → biarkan

      const img = new Image();
      img.onerror = () => reject(new Error("Berkas gambar tidak valid."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(raw);
        ctx.drawImage(img, 0, 0, w, h);
        // PNG (jaga transparansi); bila kegedean → JPEG kualitas 0.85.
        let out = canvas.toDataURL("image/png");
        if (out.length > MAX_ENCODED) out = canvas.toDataURL("image/jpeg", 0.85);
        resolve(out);
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}

export default function LogoSection({ logo, nama, kode, busy, onUpload, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [err, setErr]   = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const initials = kode.slice(0, 4).toUpperCase();

  async function handleFile(file: File | undefined) {
    setErr(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp|svg\+xml)$/.test(file.type)) {
      setErr("Format harus PNG, JPEG, WebP, atau SVG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr("Ukuran berkas maksimal 500KB — perkecil gambar dulu.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      if (dataUrl.length > MAX_ENCODED) {
        setErr("Logo terlalu besar setelah diproses. Gunakan gambar lebih sederhana.");
        return;
      }
      await onUpload(dataUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal mengunggah logo.");
    }
  }

  return (
    <div className="space-y-5 p-5">
      {err && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700 ring-1 ring-rose-100">
          <ImageOff size={14} className="shrink-0" /> {err}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* ── Dropzone / uploader ── */}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ""; }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); void handleFile(e.dataTransfer.files?.[0]); }}
            className={cn(
              "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 text-center transition",
              drag ? "border-indigo-400 bg-indigo-50" : "border-slate-300 bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/40",
              busy && "cursor-not-allowed opacity-60",
            )}
          >
            {busy ? (
              <Loader2 size={24} className="animate-spin text-indigo-500" />
            ) : logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={`Logo ${nama}`} className="max-h-[70%] max-w-[80%] object-contain" />
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <UploadCloud size={22} />
                </div>
                <p className="text-[12px] font-semibold text-slate-700">Unggah Logo RS</p>
                <p className="text-[10.5px] leading-snug text-slate-400">
                  Klik atau seret berkas ke sini
                </p>
              </>
            )}
          </button>

          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <UploadCloud size={13} />
              {logo ? "Ganti Logo" : "Pilih Berkas"}
            </button>
            {logo && (
              <button
                type="button"
                disabled={busy}
                onClick={() => { setErr(null); void onRemove(); }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
              >
                <Trash2 size={13} /> Hapus
              </button>
            )}
          </div>
        </div>

        {/* ── Panduan + preview KOP ── */}
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <Info size={15} className="mt-0.5 shrink-0 text-indigo-500" />
            <div className="text-[11.5px] leading-relaxed text-slate-600">
              <p className="font-semibold text-indigo-800">Otomatis diterapkan ke semua cetakan</p>
              Logo ini muncul di KOP surat seluruh modul — Surat Keterangan Sakit/Sehat, Resume
              Medis, SEP, Rujukan, Invoice/Kwitansi, hingga berkas E-Klaim.
            </div>
          </div>

          <ul className="space-y-1.5 text-[11px] text-slate-500">
            <li>• Format <span className="font-semibold text-slate-700">PNG transparan</span> disarankan (juga JPEG/WebP/SVG).</li>
            <li>• Rasio <span className="font-semibold text-slate-700">persegi</span>, minimal 200×200px.</li>
            <li>• Ukuran berkas maksimal <span className="font-semibold text-slate-700">500KB</span> (otomatis diperkecil ke 512px).</li>
          </ul>

          {/* Mini preview KOP */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Pratinjau KOP
            </p>
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded border-2 border-slate-700 bg-white">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="Logo" className="h-full w-full object-contain p-0.5" />
                ) : (
                  <div className="text-center">
                    <Building2 size={16} className="mx-auto text-slate-700" />
                    <p className="mt-0.5 text-[7px] font-bold tracking-widest text-slate-700">{initials}</p>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-black uppercase tracking-tight text-slate-900">{nama}</p>
                <div className="mt-1 h-1.5 w-40 rounded bg-slate-200" />
                <div className="mt-1 h-1.5 w-28 rounded bg-slate-100" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
