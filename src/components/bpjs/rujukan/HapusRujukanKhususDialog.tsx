"use client";

// Konfirmasi hapus rujukan khusus (Dialog shadcn/Radix; V-Claim DELETE /Rujukan/Khusus/delete).
// Konfirmasi destruktif → fokus awal di tombol AMAN (Batal/Tutup); dialog tidak bisa ditutup
// selama proses. user = username sesi login. Sesudah berhasil, fokus dipindah ke judul daftar
// (tombol Hapus pemicunya diganti tanda "Dihapus"). Komponen shadcn: Dialog · Alert · Empty ·
// Button · Spinner.

import { useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useSessionOptional } from "@/contexts/SessionContext";
import { fmtTglPendek } from "@/components/bpjs/shared/tanggal";
import { cn } from "@/lib/ui/utils";
import { deleteRujukanKhusus } from "@/lib/bpjs/vClaimRujukan";
import type { RujukanKhususListItem } from "@/lib/bpjs/bpjsShared";
import { labelGalat } from "./rujukanShared";

const CATATAN = "rounded-xl border-0 p-3 has-[>svg]:gap-x-2 [&>svg]:size-3.5";

export default function HapusRujukanKhususDialog({
  target,
  onClose,
  onDeleted,
  fokusSesudah,
}: {
  target: RujukanKhususListItem | null;
  onClose: () => void;
  onDeleted: (idRujukan: string) => void;
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
      const res = await deleteRujukanKhusus({
        idRujukan: target.idrujukan,
        noRujukan: target.norujukan,
        user: sesi?.session?.username ?? "tanpa-sesi",
      });
      if (!res.ok) {
        const { title, desc } = labelGalat(res.error, "Rujukan khusus");
        setGalat(`${title}. ${desc}`);
        return;
      }
      setDone(true);
      onDeleted(target.idrujukan);
    } catch {
      setGalat("Koneksi ke V-Claim gagal, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={handleOpenChange}>
      {target && (
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
                <DialogTitle className="text-sm font-semibold">Hapus rujukan khusus</DialogTitle>
                <DialogDescription className="truncate text-xs tabular-nums">
                  {target.nmpst} · ID {target.idrujukan}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <p role="status" className="sr-only">
            {done ? "Rujukan khusus berhasil dihapus" : ""}
          </p>

          <div className="px-5 py-4">
            {done ? (
              <Empty className="gap-3 p-0 py-3 md:p-0 md:py-3">
                <EmptyHeader className="gap-1">
                  <EmptyMedia variant="icon" className="mb-2 size-11 rounded-xl bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm font-semibold tracking-normal">Rujukan khusus dihapus</EmptyTitle>
                  <EmptyDescription className="text-xs">Rujukan {target.norujukan} tidak lagi tercatat sebagai rujukan khusus</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-3">
                <Alert role="note" className={cn(CATATAN, "bg-rose-50 text-rose-900")}>
                  <AlertTriangle aria-hidden="true" />
                  <AlertDescription className="text-xs/relaxed text-rose-900">
                    <p>Pasien tidak lagi bisa memakai rujukan ini untuk pelayanan khusus. Penghapusan tercatat di audit trail V-Claim.</p>
                  </AlertDescription>
                </Alert>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-slate-50 p-3 text-xs">
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Diagnosa</dt>
                    <dd className="font-medium tabular-nums">{target.diagppk}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Berlaku</dt>
                    <dd className="font-medium tabular-nums">
                      {fmtTglPendek(target.tglrujukan_awal)} – {fmtTglPendek(target.tglrujukan_berakhir)}
                    </dd>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <dt className="text-[11px] text-muted-foreground">No. rujukan</dt>
                    <dd className="truncate font-medium tabular-nums">{target.norujukan}</dd>
                  </div>
                </dl>
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
              <Button ref={amanRef} size="sm" variant="secondary" className="h-8 text-xs" autoFocus onClick={() => handleOpenChange(false)}>
                Tutup
              </Button>
            ) : (
              <>
                <Button ref={amanRef} size="sm" variant="secondary" className="h-8 text-xs" disabled={loading} onClick={() => handleOpenChange(false)}>
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
                      Hapus rujukan khusus
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
