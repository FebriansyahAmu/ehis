"use client";

// Konfirmasi hapus surat rencana kontrol / SPRI (Dialog shadcn/Radix di atas Sheet detail; V-Claim
// DELETE /RencanaKontrol/Delete — payload hanya No. surat + user, berlaku untuk keduanya). Dulu
// tab "Hapus" terpisah yang meminta ketik nomor + alasan ≥ 10 karakter, padahal alasan tidak
// dikirim ke mana pun. Konfirmasi destruktif → fokus awal di tombol AMAN (Batal); tidak bisa
// ditutup selama proses; `user` = akun login; sesudah berhasil fokus pindah ke judul detail. Surat yang SEP kontrolnya sudah terbit ditolak
// V-Claim — pesannya tampil di dialog. Komponen shadcn: Dialog · Alert · Empty · Button · Spinner.

import { useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useSessionOptional } from "@/contexts/SessionContext";
import { labelGalat } from "@/components/bpjs/shared/galat";
import { fmtTglPendek } from "@/components/bpjs/shared/tanggal";
import { cn } from "@/lib/ui/utils";
import { deleteRK } from "@/lib/bpjs/vClaimRencanaKontrol";
import { JENIS_SURAT, type JenisSurat } from "./rencanaKontrolShared";

const CATATAN = "rounded-xl border-0 p-3 has-[>svg]:gap-x-2 [&>svg]:size-3.5";

export interface TargetHapus {
  noSurat: string;
  jenis: JenisSurat;
  nama: string;
  tgl: string;
  poli: string;
}

export default function HapusSuratDialog({
  target,
  onClose,
  onDeleted,
  fokusSesudah,
}: {
  target: TargetHapus | null;
  onClose: () => void;
  onDeleted: (noSurat: string) => void;
  /** Sesudah berhasil, tombol Hapus pemicunya hilang → fokus dipindah ke sini. */
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
      const res = await deleteRK(target.noSurat, sesi?.session?.username ?? "tanpa-sesi");
      if (!res.ok) {
        const { title, desc } = labelGalat(res.error, "Surat");
        setGalat(`${title}. ${desc}`);
        return;
      }
      setDone(true);
      onDeleted(target.noSurat);
    } catch {
      setGalat("Koneksi ke V-Claim gagal, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const label = target ? JENIS_SURAT[target.jenis].label : "";
  const sebutan = target ? JENIS_SURAT[target.jenis].sebutan : "";

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
                <DialogTitle className="text-sm font-semibold">Hapus {sebutan}</DialogTitle>
                <DialogDescription className="truncate text-xs tabular-nums">
                  {target.noSurat} · {target.nama}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <p role="status" className="sr-only">
            {done ? `${label} berhasil dihapus` : ""}
          </p>

          <div className="px-5 py-4">
            {done ? (
              <Empty className="gap-3 p-0 py-3 md:p-0 md:py-3">
                <EmptyHeader className="gap-1">
                  <EmptyMedia variant="icon" className="mb-2 size-11 rounded-xl bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle className="text-sm font-semibold tracking-normal">{label} dihapus</EmptyTitle>
                  <EmptyDescription className="text-xs">Surat {target.noSurat} tidak lagi bisa dipakai untuk menerbitkan SEP</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-3">
                <Alert role="note" className={cn(CATATAN, "bg-rose-50 text-rose-900")}>
                  <AlertTriangle aria-hidden="true" />
                  <AlertDescription className="text-xs/relaxed text-rose-900">
                    <p>
                      Surat yang dihapus tidak bisa dipulihkan. Bila pasien tetap perlu {target.jenis === "spri" ? "dirawat" : "kontrol"}, terbitkan surat baru.
                      Surat yang sudah dipakai untuk SEP tidak bisa dihapus.
                    </p>
                  </AlertDescription>
                </Alert>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-slate-50 p-3 text-xs">
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Tanggal rencana</dt>
                    <dd className="font-medium tabular-nums">{fmtTglPendek(target.tgl)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] text-muted-foreground">Poli</dt>
                    <dd className="truncate font-medium">{target.poli}</dd>
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
                      Hapus surat
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
