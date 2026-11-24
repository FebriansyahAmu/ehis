"use client";

// Konfirmasi hapus SEP internal (Dialog shadcn/Radix). Konfirmasi destruktif → fokus awal di
// tombol AMAN (Batal/Tutup); dialog tidak bisa ditutup selama proses. user = username sesi login
// (dulu email hardcode). Sesudah berhasil: `onDeleted` menandai rujukan di panel, lalu saat dialog
// ditutup fokus dipindah ke judul panel (tombol Hapus pemicunya sudah tidak ada).
// Komponen shadcn: Dialog · Alert · Item · Badge · Empty · Button · Spinner.

import { useRef, useState } from "react";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Trash2 } from "lucide-react";
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
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { useSessionOptional } from "@/contexts/SessionContext";
import { cn } from "@/lib/ui/utils";
import { hapusSepInternal } from "@/lib/bpjs/vClaimSEP";
import type { SEPInternalItem } from "@/lib/bpjs/bpjsShared";
import { BADGE, errorLabel, fmtTglPendek } from "./sepShared";
import { namaPoli } from "./sepInternalShared";

const CATATAN = "rounded-xl border-0 p-3 has-[>svg]:gap-x-2 [&>svg]:size-3.5";

export default function HapusSEPInternalDialog({
  target,
  onClose,
  onDeleted,
  fokusSesudah,
}: {
  target: { noSep: string; item: SEPInternalItem } | null;
  onClose: () => void;
  onDeleted: (noSep: string, item: SEPInternalItem) => void;
  /** Dipanggil saat dialog tertutup sesudah berhasil (pengganti fokus kembali ke pemicu). */
  fokusSesudah: () => void;
}) {
  const sesi = useSessionOptional();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const amanRef = useRef<HTMLButtonElement>(null);

  function handleOpenChange(open: boolean) {
    if (open || loading) return;
    setGalat(null);
    onClose();
  }

  async function hapus() {
    if (!target || loading) return;
    setLoading(true);
    setGalat(null);
    try {
      const res = await hapusSepInternal({
        noSep: target.noSep,
        noSurat: target.item.nosurat,
        tglRujukanInternal: target.item.tglrujukinternal,
        kdPoliTuj: target.item.kdpolituj,
        user: sesi?.session?.username ?? "tanpa-sesi",
      });
      if (!res.ok) {
        const { title, desc } = errorLabel(res.error);
        setGalat(`${title}. ${desc}`);
        return;
      }
      setDone(true);
      onDeleted(target.noSep, target.item);
    } catch {
      setGalat("Koneksi ke V-Claim gagal, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const it = target?.item;

  return (
    <Dialog open={!!target} onOpenChange={handleOpenChange}>
      {target && it && (
        <DialogContent
          data-accent="rose"
          showCloseButton={!loading}
          className="gap-0 border-0 p-0 text-foreground sm:max-w-md"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            amanRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            if (!done) return; // batal → fokus kembali ke tombol Hapus pemicu (bawaan Radix)
            e.preventDefault();
            setDone(false);
            fokusSesudah();
          }}
        >
          <DialogHeader className="px-5 pt-5 text-left">
            <div className="flex items-center gap-3 pr-6">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                <Trash2 className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold">Hapus SEP internal</DialogTitle>
                <DialogDescription className="truncate text-xs tabular-nums">{it.nosurat}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Live region tetap ada sejak dialog terbuka → hasil hapus dibacakan andal. */}
          <p role="status" className="sr-only">
            {done ? "SEP internal berhasil dihapus" : ""}
          </p>

          <div className="px-5 py-4">
            {done ? (
              <Empty className="gap-3 p-0 py-3 md:p-0 md:py-3">
                <EmptyHeader className="gap-1">
                  <EmptyMedia variant="icon" className="mb-2 size-11 rounded-xl bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm font-semibold tracking-normal">SEP internal dihapus</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Rujukan ke {namaPoli(it.nmtujuanrujuk)} tidak lagi tercatat di V-Claim
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-3">
                <Alert role="note" className={cn(CATATAN, "bg-rose-50 text-rose-900")}>
                  <AlertTriangle aria-hidden="true" />
                  <AlertDescription className="text-xs/relaxed text-rose-900">
                    <p>Hapus hanya bila rujukan internal ini dibatalkan. Penghapusan tercatat di audit trail V-Claim.</p>
                  </AlertDescription>
                </Alert>

                <Item variant="muted" size="sm" className="flex-nowrap gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <ItemContent className="min-w-0 gap-1">
                    <ItemTitle className="w-full flex-wrap gap-1.5 text-xs">
                      <Badge className={cn("px-1.5 text-[11px]", BADGE.slate)}>{namaPoli(it.nmpoliasal)}</Badge>
                      <ArrowRight className="size-3 text-muted-foreground" aria-label="ke" />
                      <Badge className={cn("px-1.5 text-[11px]", BADGE.teal)}>{namaPoli(it.nmtujuanrujuk)}</Badge>
                    </ItemTitle>
                    <ItemDescription className="text-[11px] tabular-nums">
                      {it.nmdokter} · {fmtTglPendek(it.tglrujukinternal)} · SEP {target.noSep}
                    </ItemDescription>
                  </ItemContent>
                </Item>

                {galat && (
                  <Alert className={cn(CATATAN, "bg-rose-50 py-2 text-rose-800")}>
                    <AlertCircle aria-hidden="true" />
                    <AlertDescription className="text-xs text-rose-800">{galat}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-5 pb-5">
            {done ? (
              <Button
                ref={amanRef}
                size="sm"
                variant="secondary"
                className="h-8 text-xs"
                autoFocus
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
                <Button size="sm" className="h-8 bg-rose-600 text-xs text-white hover:bg-rose-700" disabled={loading} onClick={hapus}>
                  {loading ? (
                    <>
                      <Spinner className="size-3.5" aria-hidden="true" />
                      Menghapus…
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Hapus SEP internal
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
