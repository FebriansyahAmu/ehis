"use client";

// Konfirmasi Hapus SEP (Dialog shadcn/Radix: fokus terkunci, Esc menutup, fokus kembali ke
// pemicu). Konfirmasi destruktif → fokus awal di tombol AMAN (Batal/Tutup). Selama proses
// hapus, dialog tidak bisa ditutup. Alasan wajib ≥20 karakter; galat tampil setelah interaksi.

import { useId, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/ui/utils";
import type { SEPRecordExt } from "@/lib/bpjs/bpjsShared";
import { BADGE, STATUS_META, sepTerbuka } from "./sepShared";

const MIN_ALASAN = 20;

export default function HapusSEPModal({
  sep,
  onConfirm,
  onClose,
  onDeleted,
}: {
  sep: SEPRecordExt | null;
  onConfirm: (noSep: string, alasan: string) => Promise<void>;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const id = useId();
  const [alasan, setAlasan] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const amanRef = useRef<HTMLButtonElement>(null);
  const alasanRef = useRef<HTMLTextAreaElement>(null);

  const blocked = sep ? !sepTerbuka(sep.statusInternal) : false;
  const panjang = alasan.trim().length;
  const err = touched && panjang < MIN_ALASAN ? `Alasan minimal ${MIN_ALASAN} karakter, baru ${panjang}` : null;

  function reset() {
    setAlasan("");
    setTouched(false);
    setDone(false);
    setModalError(null);
  }

  function handleOpenChange(open: boolean) {
    if (open || loading) return;
    reset();
    onClose();
  }

  async function hapus() {
    setTouched(true);
    if (!sep || blocked) return;
    if (panjang < MIN_ALASAN) {
      alasanRef.current?.focus();
      return;
    }
    setLoading(true);
    setModalError(null);
    try {
      await onConfirm(sep.noSEP, alasan.trim());
      setDone(true);
      onDeleted?.();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const meta = sep ? STATUS_META[sep.statusInternal] : null;

  return (
    <Dialog open={!!sep} onOpenChange={handleOpenChange}>
      {sep && meta && (
        <DialogContent
          data-accent="rose"
          showCloseButton={!loading}
          className="gap-0 border-0 p-0 text-foreground sm:max-w-md"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            amanRef.current?.focus();
          }}
        >
          <DialogHeader className="px-5 pt-5 text-left">
            <div className="flex items-center gap-3 pr-6">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                <Trash2 className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold">Hapus SEP</DialogTitle>
                <DialogDescription className="truncate font-mono text-xs">{sep.noSEP}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-5 py-4">
            {done ? (
              <div className="flex flex-col items-center gap-3 py-3 text-center" role="status">
                <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">SEP berhasil dihapus</p>
                  <p className="mt-1 text-xs text-muted-foreground">Penghapusan tercatat di audit trail V-Claim BPJS</p>
                </div>
              </div>
            ) : blocked ? (
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3.5 text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p className="text-xs leading-relaxed">
                  SEP berstatus <strong className="font-semibold">{meta.label.toLowerCase()}</strong> tidak dapat dihapus.
                  SEP yang ditutup sudah punya tanggal pulang atau data klaim.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs leading-relaxed text-rose-900">
                  <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                  Penghapusan tidak dapat dibatalkan dan tercatat di audit trail V-Claim. Pastikan tidak ada klaim aktif
                  yang terhubung ke SEP ini.
                </p>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      <span className="font-mono">{sep.diagAwal}</span> · {sep.diagAwalNama ?? "—"}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">{sep.noKartu}</p>
                  </div>
                  <Badge className={cn("shrink-0", BADGE[meta.tone])}>{meta.label}</Badge>
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <label htmlFor={`${id}-alasan`} className="text-xs font-medium">
                      Alasan penghapusan
                    </label>
                    <span
                      id={`${id}-hitung`}
                      className={cn("text-[11px] tabular-nums", panjang >= MIN_ALASAN ? "text-emerald-700" : "text-muted-foreground")}
                    >
                      {panjang}/{MIN_ALASAN}+ karakter
                    </span>
                  </div>
                  <textarea
                    ref={alasanRef}
                    id={`${id}-alasan`}
                    rows={3}
                    value={alasan}
                    placeholder="Mis. SEP terbit ganda untuk kunjungan yang sama"
                    aria-invalid={Boolean(err)}
                    aria-describedby={err ? `${id}-hitung ${id}-err` : `${id}-hitung`}
                    onChange={(e) => setAlasan(e.target.value)}
                    onBlur={() => alasan && setTouched(true)}
                    className={cn(
                      "w-full resize-none rounded-xl px-3 py-2.5 text-sm transition-[background-color,box-shadow] outline-none placeholder:text-muted-foreground/70 focus-visible:ring-[3px]",
                      err ? "bg-rose-50 focus-visible:ring-rose-200" : "bg-slate-100 focus-visible:bg-white focus-visible:ring-ring/40",
                    )}
                  />
                  {err && (
                    <p id={`${id}-err`} className="mt-1.5 flex items-center gap-1 text-xs text-rose-700">
                      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                      {err}
                    </p>
                  )}
                </div>

                {modalError && (
                  <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800">
                    {modalError}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-5 pb-5">
            {done || blocked ? (
              <Button ref={amanRef} size="sm" variant="secondary" className="h-8 text-xs" autoFocus={done} onClick={() => handleOpenChange(false)}>
                Tutup
              </Button>
            ) : (
              <>
                <Button
                  ref={amanRef}
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs"
                  disabled={loading}
                  onClick={() => handleOpenChange(false)}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-rose-600 text-xs text-white hover:bg-rose-700"
                  disabled={loading}
                  onClick={hapus}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      Menghapus…
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Hapus SEP
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
