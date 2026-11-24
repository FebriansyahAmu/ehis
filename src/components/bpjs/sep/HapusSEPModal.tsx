"use client";

// Konfirmasi Hapus SEP (Dialog shadcn/Radix: fokus terkunci, Esc menutup, fokus kembali ke
// pemicu). Konfirmasi destruktif → fokus awal di tombol AMAN (Batal/Tutup). Selama proses
// hapus, dialog tidak bisa ditutup. Alasan wajib ≥20 karakter; galat tampil setelah interaksi.
// Komponen shadcn: Dialog · Alert · Item · Label · Textarea · Empty · Badge · Button · Spinner.
// Peringatan statis memakai role="note" (bukan role="alert" bawaan Alert) agar tidak
// dibacakan mendadak saat dialog dibuka; hanya galat dari server yang role="alert".

import { useId, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useUmumkanGalat } from "@/components/bpjs/shared/useUmumkanGalat";
import { cn } from "@/lib/ui/utils";
import type { SEPRecordExt } from "@/lib/bpjs/bpjsShared";
import { BADGE, STATUS_META, sepTerbuka } from "./sepShared";

const MIN_ALASAN = 20;
const CATATAN = "rounded-xl border-0 p-3 has-[>svg]:gap-x-2 [&>svg]:size-3.5";

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
  const pengumum = useUmumkanGalat();

  const blocked = sep ? !sepTerbuka(sep.statusInternal) : false;
  const panjang = alasan.trim().length;
  const pesanGalat = (n: number) => `Alasan minimal ${MIN_ALASAN} karakter, baru ${n}`;
  const err = touched && panjang < MIN_ALASAN ? pesanGalat(panjang) : null;

  function reset() {
    setAlasan("");
    setTouched(false);
    setDone(false);
    setModalError(null);
    pengumum.bersihkan();
  }

  function handleOpenChange(open: boolean) {
    if (open || loading) return;
    reset();
    onClose();
  }

  function ubah(v: string) {
    setAlasan(v);
    if (v.trim().length >= MIN_ALASAN) pengumum.bersihkan();
  }

  function handleBlur() {
    if (!alasan) return;
    setTouched(true);
    if (panjang < MIN_ALASAN) pengumum.umumkan(pesanGalat(panjang));
  }

  async function hapus() {
    setTouched(true);
    if (!sep || blocked) return;
    if (panjang < MIN_ALASAN) {
      pengumum.tandaiDibacakan();
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
                <DialogDescription className="truncate text-xs tabular-nums">{sep.noSEP}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Live region tetap ada sejak dialog terbuka → perubahan isinya dibacakan andal. */}
          <p role="status" className="sr-only">
            {done ? "SEP berhasil dihapus" : ""}
          </p>

          <div className="px-5 py-4">
            {done ? (
              <Empty className="gap-3 p-0 py-3 md:p-0 md:py-3">
                <EmptyHeader className="gap-1">
                  <EmptyMedia variant="icon" className="mb-2 size-11 rounded-xl bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm font-semibold tracking-normal">SEP berhasil dihapus</EmptyTitle>
                  <EmptyDescription className="text-xs">Penghapusan tercatat di audit trail V-Claim BPJS</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : blocked ? (
              <Alert role="note" className={cn(CATATAN, "bg-amber-50 text-amber-900")}>
                <AlertTriangle aria-hidden="true" />
                <AlertDescription className="text-xs/relaxed text-amber-900">
                  <p>
                    SEP berstatus <strong className="font-semibold">{meta.label.toLowerCase()}</strong> tidak dapat
                    dihapus. SEP yang ditutup sudah punya tanggal pulang atau data klaim.
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex flex-col gap-3">
                <Alert role="note" className={cn(CATATAN, "bg-rose-50 text-rose-900")}>
                  <AlertTriangle aria-hidden="true" />
                  <AlertDescription className="text-xs/relaxed text-rose-900">
                    <p>
                      Penghapusan tidak dapat dibatalkan dan tercatat di audit trail V-Claim. Pastikan tidak ada klaim
                      aktif yang terhubung ke SEP ini.
                    </p>
                  </AlertDescription>
                </Alert>

                <Item variant="muted" size="sm" className="flex-nowrap gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <ItemContent className="min-w-0 gap-0">
                    <ItemTitle className="block w-full truncate text-xs">
                      <span className="tabular-nums">{sep.diagAwal}</span> · {sep.diagAwalNama ?? "—"}
                    </ItemTitle>
                    <ItemDescription className="text-[11px] tabular-nums">{sep.noKartu}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Badge className={cn("shrink-0", BADGE[meta.tone])}>{meta.label}</Badge>
                  </ItemActions>
                </Item>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor={`${id}-alasan`} className="text-xs">
                      Alasan penghapusan
                    </Label>
                    <span
                      id={`${id}-hitung`}
                      className={cn("text-[11px] tabular-nums", panjang >= MIN_ALASAN ? "text-emerald-700" : "text-muted-foreground")}
                    >
                      {panjang}/{MIN_ALASAN}+ karakter
                    </span>
                  </div>
                  <Textarea
                    ref={alasanRef}
                    id={`${id}-alasan`}
                    value={alasan}
                    placeholder="Mis. SEP terbit ganda untuk kunjungan yang sama"
                    aria-invalid={Boolean(err)}
                    aria-describedby={err ? `${id}-hitung ${id}-err` : `${id}-hitung`}
                    onChange={(e) => ubah(e.target.value)}
                    onBlur={handleBlur}
                    className="min-h-20 resize-none rounded-xl border-0 bg-slate-100 px-3 py-2.5 shadow-none placeholder:text-muted-foreground/70 focus-visible:bg-white focus-visible:ring-ring/40 aria-invalid:bg-rose-50"
                  />
                  {err && (
                    <p id={`${id}-err`} className="flex items-center gap-1 text-xs text-rose-700">
                      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                      {err}
                    </p>
                  )}
                  <p aria-live="polite" className="sr-only">
                    {pengumum.teks}
                  </p>
                </div>

                {modalError && (
                  <Alert className={cn(CATATAN, "bg-rose-50 py-2 text-rose-800")}>
                    <AlertCircle aria-hidden="true" />
                    <AlertDescription className="text-xs text-rose-800">{modalError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-5 pb-5">
            {done || blocked ? (
              <Button
                ref={amanRef}
                size="sm"
                variant="secondary"
                className="h-8 text-xs"
                autoFocus={done}
                onClick={() => handleOpenChange(false)}
              >
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
                      <Spinner className="size-3.5" aria-hidden="true" />
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
