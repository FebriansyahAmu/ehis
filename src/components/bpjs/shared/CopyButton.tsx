"use client";

// Tombol salin kecil (Button shadcn ghost, 24×24) untuk nomor (kartu/NIK/MR/SEP). Nama aksesibel
// menyebut APA yang disalin; gelembung konfirmasi = live region DI LUAR tombol (isi tombol
// dianggap presentasional) yang tampil/hilang lewat opacity agar tetap dibacakan; ikon berganti
// salin → centang (bukan warna saja). Tidak di-disable saat umpan balik tampil — menyalin ulang aman.

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/utils";

// VoiceOver melewati pesan yang sama dengan pesan sebelumnya → tambahkan spasi tak-putus.
let pesanTerakhir = "";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const [pesan, setPesan] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function salin() {
    window.clearTimeout(timer.current);
    let ok = true;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      ok = false;
    }
    let msg = ok ? "Disalin" : "Gagal menyalin";
    if (msg === pesanTerakhir) msg += " ";
    pesanTerakhir = msg;
    setState(ok ? "ok" : "fail");
    setPesan("");
    requestAnimationFrame(() => setPesan(msg));
    timer.current = window.setTimeout(() => {
      setState("idle");
      setPesan("");
    }, 2000);
  }

  return (
    <span className="relative inline-flex">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={salin}
        aria-label={`Salin ${label}`}
        className="text-muted-foreground hover:text-foreground"
      >
        {state === "ok" ? (
          <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
      </Button>
      <span
        role="status"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[11px] whitespace-nowrap text-background transition-opacity duration-150",
          state === "idle" ? "opacity-0" : "opacity-100",
        )}
      >
        {pesan}
      </span>
    </span>
  );
}
