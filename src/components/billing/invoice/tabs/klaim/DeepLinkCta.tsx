"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  href: string;
  noKlaim: string | null;
  variant?: "existing" | "new";
  onClick?: (href: string) => void;
}

/**
 * Deep-link CTA besar ke modul `/ehis-eklaim`.
 *
 * - `variant="existing"` (default): "Buka di E-Klaim →" untuk klaim sudah ada.
 * - `variant="new"`: "Mulai Proses Klaim →" untuk fallback empty state.
 *
 * NOTE: modul /ehis-eklaim belum dibangun — onClick fallback ke `console.log`
 * untuk hindari 404 saat development. Wiring `router.push(href)` aktif saat
 * EK0 route entry siap.
 */
export default function DeepLinkCta({
  href, noKlaim, variant = "existing", onClick,
}: Props) {
  const label = variant === "new" ? "Mulai Proses Klaim" : "Buka di E-Klaim";
  const subtext = variant === "new"
    ? "Buat draft klaim baru — input coding ICD, generate berkas, kirim ke V-Claim"
    : "Lihat detail lengkap, edit berkas, submit / banding";

  const handleClick = () => {
    if (onClick) onClick(href);
    else console.log("[BL2.4] Deep link to E-Klaim (route belum dibangun):", href);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-xl px-4 py-3 text-left shadow-sm ring-1 transition-all",
        "bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white ring-amber-400/40 hover:shadow-md hover:ring-amber-400/60",
      )}
    >
      {/* Decorative shine on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
      />

      <div className="relative z-10 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <ExternalLink size={13} className="text-amber-100" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-100">
            E-Klaim BPJS / Asuransi
          </span>
        </div>
        <p className="mt-0.5 text-[14.5px] font-bold leading-tight">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[11.5px] text-amber-50/85">
          {subtext}
        </p>
      </div>

      <div className="relative z-10 flex flex-none items-center gap-3">
        {noKlaim && (
          <div className="hidden text-right md:block">
            <p className="text-[9.5px] uppercase tracking-wider text-amber-100/90">No Klaim</p>
            <p className="font-mono text-[11.5px] font-semibold tabular-nums">{noKlaim}</p>
          </div>
        )}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 transition-transform group-hover:translate-x-0.5">
          <ArrowRight size={15} />
        </span>
      </div>
    </motion.button>
  );
}
