"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, ShieldAlert, BookOpen, Users, Syringe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmasiQueue } from "@/lib/farmasi/farmasiQueueStore";
import { getPIOLogs } from "@/components/farmasi/pio/pioShared";
import { listFarmasiResep } from "@/lib/api/resep/resep";
import { listFarmasiBmhp } from "@/lib/api/bmhpOrder/bmhpOrder";
import FarmasiBoard       from "./FarmasiBoard";
import FarmasiBmhpBoard   from "./FarmasiBmhpBoard";
import FarmasiQueueBoard  from "./antrean/FarmasiQueueBoard";
import RegisterNarPsiPane from "./narPsi/RegisterNarPsiPane";
import PIOPane            from "./pio/PIOPane";

type FarmasiMainTab = "antrean" | "worklist" | "bmhp" | "narpsi" | "pio";

const TABS: { id: FarmasiMainTab; label: string; icon: IconComponent; sub: string }[] = [
  { id: "antrean",  label: "Antrean Farmasi",                   icon: Users,       sub: "Panggil · Siapkan (T6) · Serah (T7)" },
  { id: "worklist", label: "Worklist Order",                    icon: LayoutGrid,  sub: "Telaah · Dispensasi · Serah Terima" },
  { id: "bmhp",     label: "Worklist BMHP",                     icon: Syringe,     sub: "Terima & keluarkan BMHP (tanpa telaah)" },
  { id: "narpsi",   label: "Register Narkotika / Psikotropika", icon: ShieldAlert, sub: "UU 35/2009 · PMK 3/2015"            },
  { id: "pio",      label: "Pelayanan Informasi Obat",          icon: BookOpen,    sub: "PMK 72/2016 Ps. 27-29"              },
];

// ── Badge notifikasi (angka) ber-animasi: ping ring kontinu + pop spring saat angka berubah ──

type BadgeTone = "sky" | "amber" | "rose" | "emerald";
const BADGE_BG: Record<BadgeTone, string> = {
  sky:     "bg-sky-500",
  amber:   "bg-amber-500",
  rose:    "bg-rose-500",
  emerald: "bg-emerald-500",
};

function NotifBadge({ count, tone }: { count: number; tone: BadgeTone }) {
  if (count <= 0) return null;
  return (
    <span className="relative ml-1.5 inline-flex shrink-0" aria-label={`${count} perlu perhatian`}>
      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", BADGE_BG[tone])} />
      <motion.span
        key={count}
        initial={{ scale: 0.4 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 18 }}
        className={cn(
          "relative inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm",
          BADGE_BG[tone],
        )}
      >
        {count > 99 ? "99+" : count}
      </motion.span>
    </span>
  );
}

export default function FarmasiViewTabs() {
  const [active, setActive] = useState<FarmasiMainTab>("worklist");

  // ── Sumber angka notifikasi per tab ──
  const queue = useFarmasiQueue();
  const antreanAktif = queue.filter((e) => e.status !== "Selesai").length; // antrean pasien belum selesai

  // Angka badge non-reaktif (Worklist belum-diterima = DB · PIO pending = store) di-refresh TANPA
  // reload halaman: poll ringan 15 dtk + refetch INSTAN saat tab/jendela kembali fokus + saat pindah tab.
  // (Push real-time lintas-user sub-detik = butuh SSE — lihat catatan.)
  const [belumDiterima, setBelumDiterima] = useState(0);
  const [bmhpBelum, setBmhpBelum] = useState(0);
  const [pioPending, setPioPending] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (alive) setPioPending(getPIOLogs().filter((l) => l.status === "Pending").length);
      try {
        const rows = await listFarmasiResep({});
        if (alive) setBelumDiterima(rows.filter((o) => o.status === "Menunggu").length);
      } catch {
        /* diam — badge advisory */
      }
      try {
        const brows = await listFarmasiBmhp({});
        if (alive) setBmhpBelum(brows.filter((o) => o.status === "Menunggu").length);
      } catch {
        /* diam — badge advisory */
      }
    };
    void load();
    const t = setInterval(load, 15_000);
    const onFocus = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [active]);

  function badgeFor(id: FarmasiMainTab): { count: number; tone: BadgeTone } | null {
    if (id === "antrean") return { count: antreanAktif, tone: "sky" };
    if (id === "worklist") return { count: belumDiterima, tone: "amber" };
    if (id === "bmhp") return { count: bmhpBelum, tone: "amber" };
    if (id === "pio") return { count: pioPending, tone: "rose" };
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          const badge = badgeFor(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left transition-all duration-150",
                isActive
                  ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
              )}
            >
              <Icon size={15} className={isActive ? "text-sky-600" : "text-slate-400"} aria-hidden />
              <div>
                <p className={cn("text-xs font-bold leading-none", isActive ? "text-sky-700" : "text-slate-600")}>
                  {tab.label}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{tab.sub}</p>
              </div>
              {badge && <NotifBadge count={badge.count} tone={badge.tone} />}
              {isActive && !badge?.count && (
                <span className="ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {active === "antrean"  && <FarmasiQueueBoard />}
          {active === "worklist" && <FarmasiBoard />}
          {active === "bmhp"     && <FarmasiBmhpBoard />}
          {active === "narpsi"   && <RegisterNarPsiPane />}
          {active === "pio"      && <PIOPane />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
