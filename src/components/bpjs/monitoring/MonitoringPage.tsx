"use client";

// BPJS V-Claim → Monitoring. Empat sub-tab (Tabs shadcn/Radix) tersimpan di URL (`?tab=`, lewat
// history.replaceState — tanpa round-trip server); aktivasi MANUAL (Enter/klik) karena memilih
// tab mengubah URL. Panel dipasang saat PERTAMA dikunjungi lalu tetap terpasang (disembunyikan
// saat tidak aktif) — hasil & saringan tidak hilang saat pindah tab, dan tab yang belum dibuka
// tidak memanggil V-Claim. Tombol "Histori" di Kunjungan/Klaim/Jasa Raharja membuka tab Histori
// pelayanan untuk peserta itu. Dulu: kartu statistik dihitung langsung dari data mock + empat
// panel "pilih filter lalu klik Cari"; kini tiap tab memuat otomatis & meringkas datanya sendiri.
// Komponen shadcn: Tabs · Badge · Skeleton (kartu tanpa garis, aksen emerald).

import { Suspense, useCallback, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { Activity, CarFront, History, ReceiptText, UsersRound, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSkeletonDelay } from "@/components/master/shared";
import { cn } from "@/lib/ui/utils";
import KunjunganTab from "./KunjunganTab";
import KlaimTab from "./KlaimTab";
import HistoriTab, { type PrefillHistori } from "./HistoriTab";
import JasaRaharjaTab from "./JasaRaharjaTab";

const TABS = [
  { key: "kunjungan", label: "Kunjungan", icon: UsersRound },
  { key: "klaim", label: "Klaim", icon: ReceiptText },
  { key: "histori", label: "Histori pelayanan", icon: History },
  { key: "jasaraharja", label: "Jasa Raharja", icon: CarFront },
] as const satisfies readonly { key: string; label: string; icon: LucideIcon }[];

type TabKey = (typeof TABS)[number]["key"];

function isTab(v: string | null): v is TabKey {
  return TABS.some((t) => t.key === v);
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-5" aria-hidden="true">
      <Skeleton className="h-10 w-72 rounded-lg" />
      <Skeleton className="h-9 w-full max-w-xl rounded-lg" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

function MonitoringPageInner() {
  const loaded = useSkeletonDelay(400);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = searchParams.get("tab");
  const tab: TabKey = isTab(t) ? t : "kunjungan";
  const [dikunjungi, setDikunjungi] = useState<ReadonlySet<TabKey>>(() => new Set([tab]));
  if (!dikunjungi.has(tab)) setDikunjungi(new Set(dikunjungi).add(tab)); // adjust-on-render
  const [prefill, setPrefill] = useState<PrefillHistori | null>(null);

  const gantiTab = useCallback(
    (v: string) => {
      if (!isTab(v)) return;
      // replaceState: Next.js menyinkronkan useSearchParams tanpa memuat ulang segmen dari server.
      window.history.replaceState(null, "", `${pathname}?tab=${v}`);
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-tab="${v}"]`)
          ?.scrollIntoView({ block: "nearest", inline: "nearest", container: "nearest" } as ScrollIntoViewOptions);
      });
    },
    [pathname],
  );

  const bukaHistori = useCallback(
    (kartu: string, acuan: string) => {
      setPrefill((p) => ({ kartu, acuan, n: (p?.n ?? 0) + 1 }));
      gantiTab("histori");
    },
    [gantiTab],
  );

  if (!loaded) return <PageSkeleton />;

  const panel: Record<TabKey, ReactNode> = {
    kunjungan: <KunjunganTab onHistori={bukaHistori} />,
    klaim: <KlaimTab onHistori={bukaHistori} />,
    histori: <HistoriTab prefill={prefill} aktif={tab === "histori"} />,
    jasaraharja: <JasaRaharjaTab onHistori={bukaHistori} />,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div data-accent="emerald" className="flex h-full min-h-0 flex-col text-foreground">
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Activity className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Monitoring</h1>
            <p className="truncate text-xs text-muted-foreground">Kunjungan, status klaim, histori pelayanan peserta, dan jaminan Jasa Raharja lewat V-Claim BPJS</p>
          </div>
          <Badge variant="secondary" className="bg-white text-[11px] text-muted-foreground tabular-nums shadow-xs">
            V-Claim
          </Badge>
        </header>

        <Tabs value={tab} onValueChange={gantiTab} activationMode="manual" className="min-h-0 flex-1 gap-0">
          <div className="shrink-0 overflow-x-auto px-4 pt-3 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
            <TabsList variant="line" aria-label="Fitur monitoring" className="w-max gap-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  data-tab={key}
                  className={cn(
                    "flex-none px-2.5 text-xs text-muted-foreground hover:text-foreground",
                    "data-[state=active]:text-emerald-800",
                    // Penanda tab aktif = garis bawah dari BORDER pseudo-elemen (tetap terlihat di
                    // forced-colors), bukan warna saja.
                    "after:h-0 after:border-b-2 after:border-emerald-600 after:bg-transparent",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {TABS.map(({ key }) => (
            <TabsContent
              key={key}
              value={key}
              forceMount={dikunjungi.has(key) || undefined}
              className="min-h-0 overflow-y-auto data-[state=inactive]:hidden"
            >
              {dikunjungi.has(key) && panel[key]}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MotionConfig>
  );
}

export default function MonitoringPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MonitoringPageInner />
    </Suspense>
  );
}
