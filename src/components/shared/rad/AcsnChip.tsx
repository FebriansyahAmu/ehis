"use client";

// Chip Accession Number (ACSN) radiologi + tombol salin. ACSN dibangkitkan server saat order (1 per
// pemeriksaan) dan diketik/di-worklist ke modalitas → DICOM router mencocokkan ImagingStudy ke
// ServiceRequest SatuSehat (FHIR L17). Salin: Async Clipboard; fallback execCommand hanya bila halaman
// tidak secure-context (intranet RS via http) — clipboard API tidak tersedia di sana.
// Umpan balik = gelembung role="status" DI LUAR tombol (live region), tampil via opacity (tetap di a11y tree),
// ikon berganti (tidak mengandalkan warna saja), tombol tidak pernah di-disable.

import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "ok" | "fail";

/** VoiceOver melewatkan pesan identik berturut-turut → pesan berulang diberi no-break space (tak dibacakan). */
let lastMessage = "";

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

async function salin(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return legacyCopy(text);
  }
}

interface Props {
  acsn: string | null | undefined;
  /** Nama pemeriksaan — dipakai di aria-label agar beberapa tombol salin dapat dibedakan. */
  pemeriksaan?: string;
  /** false = teks saja (mis. di dalam kartu yang sudah berupa tautan — tombol bersarang tidak sah). */
  copyable?: boolean;
  className?: string;
}

export default function AcsnChip({ acsn, pemeriksaan, copyable = true, className }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (!acsn) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] text-slate-400", className)}>
        ACSN <span className="font-mono">—</span>
      </span>
    );
  }

  const value = acsn;

  async function onCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (timer.current) clearTimeout(timer.current);
    setStatus("idle");
    setMessage("");
    const ok = await salin(value);
    let msg = ok ? "ACSN tersalin" : "Gagal menyalin";
    if (msg === lastMessage) msg += " ";
    lastMessage = msg;
    setStatus(ok ? "ok" : "fail");
    requestAnimationFrame(() => setMessage(msg));
    timer.current = setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 2000);
  }

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1 rounded-md bg-sky-50 py-0.5 pl-1.5 text-[10px] ring-1 ring-sky-200",
        copyable ? "pr-0.5" : "pr-1.5",
        className,
      )}
    >
      <span className="font-semibold uppercase tracking-wide text-sky-700/70">ACSN</span>
      <span className="font-mono font-semibold tabular-nums text-sky-900 select-all">{value}</span>
      {copyable && (
        <>
          <button
            type="button"
            onClick={onCopy}
            aria-label={`Salin ACSN ${value}${pemeriksaan ? ` (${pemeriksaan})` : ""}`}
            className={cn(
              "inline-flex min-h-6 min-w-6 items-center justify-center rounded text-sky-600 transition-colors",
              "hover:bg-sky-100 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              status === "ok" && "text-emerald-600",
              status === "fail" && "text-rose-600",
            )}
          >
            {status === "ok" ? <Check size={12} aria-hidden /> : status === "fail" ? <X size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
          </button>
          <span
            role="status"
            className={cn(
              "pointer-events-none absolute bottom-full right-0 z-10 mb-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white shadow",
              "transition-opacity duration-150 motion-reduce:transition-none",
              status === "fail" ? "bg-rose-600" : "bg-slate-800",
              message ? "opacity-100" : "opacity-0",
            )}
          >
            {message}
          </span>
        </>
      )}
    </span>
  );
}
