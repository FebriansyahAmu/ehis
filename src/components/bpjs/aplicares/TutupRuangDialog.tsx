"use client";

// Konfirmasi tutup sementara satu ruang rawat (Dialog shadcn/Radix di atas Sheet detail). Tutup =
// lapor tempat tidur tersedia 0 ke Aplicares sampai ruangan dibuka kembali; pasien yang sedang
// dirawat tidak terpengaruh. Alasan wajib (≥ 10 karakter) — dicatat di audit RS, tidak dikirim ke
// BPJS. Fokus awal ke kolom alasan; galat tampil sesudah kolom ditinggal atau saat Tutup ditekan
// (fokus kembali ke kolom). Tidak bisa ditutup selama proses; galat BPJS tampil di dialog.
// Komponen shadcn: Dialog · Textarea · Alert · Button · Spinner.

import { useId, useRef, useState, type FormEvent } from "react";
import { AlertCircle, DoorClosed } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { LabelWajib, PesanGalat } from "@/components/bpjs/shared/formUi";
import { labelGalat } from "@/components/bpjs/shared/galat";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import type { BarisRuang } from "./ketersediaanShared";

const MIN_ALASAN = 10;

export default function TutupRuangDialog({
  ruang,
  open,
  onOpenChange,
  onTutup,
  fokusSesudah,
}: {
  ruang: BarisRuang;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kirim tutup sementara; null = berhasil. */
  onTutup: (alasan: string) => Promise<BPJSError | null>;
  /** Sesudah berhasil, tombol pemicunya hilang → fokus dipindah ke sini. */
  fokusSesudah: () => void;
}) {
  const id = useId();
  const [alasan, setAlasan] = useState("");
  const [disentuh, setDisentuh] = useState(false);
  const [proses, setProses] = useState(false);
  const [galatKirim, setGalatKirim] = useState<string | null>(null);
  const selesai = useRef(false);
  const kolomRef = useRef<HTMLTextAreaElement>(null);

  const panjang = alasan.trim().length;
  const galat = panjang < MIN_ALASAN ? `Tulis alasan minimal ${MIN_ALASAN} karakter (baru ${panjang})` : null;
  const tampilGalat = disentuh ? galat : null;

  // Isian bersih tiap kali dibuka: induk memasang ulang dialog lewat `key`.
  function gantiBuka(o: boolean) {
    if (!o && proses) return;
    onOpenChange(o);
  }

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (proses) return;
    setDisentuh(true);
    if (galat) {
      kolomRef.current?.focus();
      return;
    }
    setProses(true);
    setGalatKirim(null);
    try {
      const err = await onTutup(alasan.trim());
      if (err) {
        const { title, desc } = labelGalat(err, "Ruang", "Aplicares");
        setGalatKirim(`${title}. ${desc}`);
        return;
      }
      selesai.current = true;
      onOpenChange(false);
    } finally {
      setProses(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={gantiBuka}>
      <DialogContent
        data-accent="rose"
        showCloseButton={!proses}
        className="gap-0 border-0 p-0 text-foreground sm:max-w-md"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          kolomRef.current?.focus();
        }}
        onCloseAutoFocus={(e) => {
          if (!selesai.current) return; // batal → fokus kembali ke tombol pemicu (bawaan Radix)
          e.preventDefault();
          selesai.current = false;
          fokusSesudah();
        }}
      >
        <form onSubmit={kirim} noValidate>
          <DialogHeader className="px-5 pt-5 text-left">
            <div className="flex items-center gap-3 pr-6">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                <DoorClosed className="size-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold">Tutup sementara</DialogTitle>
                <DialogDescription className="truncate text-xs tabular-nums">
                  {ruang.namaRuang} · {ruang.kodeRuang}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-3 px-5 py-4">
            <p className="rounded-xl bg-slate-50 p-3 text-xs/relaxed text-muted-foreground">
              Tempat tidur tersedia dilaporkan <span className="font-semibold text-foreground">0</span> ke Aplicares sampai ruangan dibuka kembali. Pasien yang
              sedang dirawat ({ruang.terisi}) tidak terpengaruh.
            </p>
            <div className="flex flex-col gap-1.5">
              <LabelWajib htmlFor={`${id}-alasan`}>Alasan</LabelWajib>
              <Textarea
                ref={kolomRef}
                id={`${id}-alasan`}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                onBlur={() => {
                  if (alasan !== "") setDisentuh(true);
                }}
                rows={3}
                maxLength={200}
                placeholder="Mis. renovasi kamar mandi, disinfeksi pasca kasus infeksi"
                aria-invalid={Boolean(tampilGalat)}
                aria-describedby={`${id}-bantu${tampilGalat ? ` ${id}-galat` : ""}`}
                className="min-h-20 resize-none rounded-xl border-0 bg-slate-100 text-xs shadow-none focus-visible:bg-white focus-visible:ring-ring/40 aria-invalid:bg-rose-50 md:text-xs"
              />
              <p id={`${id}-bantu`} className="text-[11px] text-muted-foreground tabular-nums">
                Dicatat di audit RS, tidak dikirim ke BPJS · {panjang}/200
              </p>
              {tampilGalat && <PesanGalat id={`${id}-galat`}>{tampilGalat}</PesanGalat>}
            </div>
            {galatKirim && (
              <Alert className="rounded-xl border-0 bg-rose-50 p-3 text-rose-800 has-[>svg]:gap-x-2 [&>svg]:size-3.5">
                <AlertCircle aria-hidden="true" />
                <AlertDescription className="text-xs text-rose-800">{galatKirim}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="px-5 pb-5">
            <Button type="button" size="sm" variant="secondary" className="h-8 text-xs" disabled={proses} onClick={() => gantiBuka(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" className="h-8 bg-rose-600 text-xs text-white hover:bg-rose-700" disabled={proses}>
              {proses ? (
                <>
                  <Spinner className="size-3.5" aria-hidden="true" />
                  Menutup…
                </>
              ) : (
                <>
                  <DoorClosed className="size-3.5" aria-hidden="true" />
                  Tutup ruangan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
