"use client";

// Tombol salin nilai (nomor pendaftaran, SEP, dst.) — ikon saja, bernama lewat aria-label.
// Umpan balik = gelembung `role="status"` DI LUAR tombol (anak tombol tidak andal diumumkan),
// tampil/sembunyi lewat opacity (tetap di pohon aksesibilitas). Ikon berganti Copy → Check
// (bukan warna saja). Gagal juga ditampilkan. Klik berulang me-reset timer, tombol tak di-disable.
// HTTP non-localhost (LAN RS) tak punya navigator.clipboard → fallback execCommand.

import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/ui/utils";

let lastMessage = ""; // VoiceOver melewati pesan identik berturut-turut → bedakan dengan NBSP.

function legacyCopy(text: string): boolean {
  const field = Object.assign(document.createElement("textarea"), { value: text });
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
  document.body.append(field);
  field.select();
  try {
    return document.execCommand("copy");
  } finally {
    field.remove();
  }
}

interface Props {
  value: string;
  /** Nama yang disalin, mis. "No. Pendaftaran" → aria-label "Salin No. Pendaftaran". */
  label: string;
  className?: string;
}

export default function CopyValueButton({ value, label, className }: Props) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const report = (ok: boolean) => {
    clearTimeout(timer.current);
    let msg = ok ? "Disalin" : "Gagal menyalin";
    if (msg === lastMessage) msg += " ";
    lastMessage = msg;
    setState(ok ? "ok" : "fail");
    setMessage("");
    requestAnimationFrame(() => setMessage(msg));
    timer.current = setTimeout(() => {
      setState("idle");
      setMessage("");
    }, 2000);
  };

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      report(true);
    } catch {
      report(legacyCopy(value));
    }
  };

  const Icon = state === "ok" ? Check : state === "fail" ? X : Copy;

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={copy}
        aria-label={`Salin ${label}`}
        className={cn(
          "inline-flex min-h-6 min-w-6 items-center justify-center rounded-md text-slate-500 transition-colors",
          "hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-600",
          state === "ok" && "text-emerald-600",
          state === "fail" && "text-rose-600",
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
      <span
        role="status"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-md bg-slate-900 px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-white transition-opacity duration-150",
          message ? "opacity-100" : "opacity-0",
        )}
      >
        {message}
      </span>
    </span>
  );
}
