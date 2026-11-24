"use client";

// Tombol salin kecil untuk nomor (kartu/NIK/MR). Nama aksesibel menyebut APA yang disalin;
// gelembung konfirmasi = live region (di luar tombol) yang tampil/hilang lewat opacity agar
// tetap dibacakan; ikon berganti salin → centang (bukan warna saja). Tidak di-disable saat
// umpan balik tampil — menyalin ulang aman.

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/ui/utils";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function salin() {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("ok");
    } catch {
      setState("fail");
    }
    timer.current = window.setTimeout(() => setState("idle"), 2000);
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={salin}
        aria-label={`Salin ${label}`}
        title={`Salin ${label}`}
        className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {state === "ok" ? (
          <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
      </button>
      <span
        role="status"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md bg-slate-900 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-white transition-opacity duration-150",
          state === "idle" ? "opacity-0" : "opacity-100",
        )}
      >
        {state === "ok" ? "Disalin" : state === "fail" ? "Gagal menyalin" : ""}
      </span>
    </span>
  );
}
