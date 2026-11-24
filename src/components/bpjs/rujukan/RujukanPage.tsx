"use client";

// BPJS V-Claim → Rujukan. Empat sub-tab (Tabs shadcn/Radix) tersimpan di URL (`?tab=`, lewat
// history.replaceState — tanpa round-trip server); aktivasi MANUAL (Enter/klik) karena memilih
// tab mengubah URL. Tab terpilih digulir ke pandangan di dalam daftar tab saja (container
// "nearest"), tidak menggulir halaman. Panel dipasang saat PERTAMA dikunjungi lalu tetap terpasang
// (disembunyikan saat tidak aktif) — hasil cari tidak hilang saat pindah tab, dan tab yang belum
// dibuka tidak memanggil V-Claim. Dulu satu layar tiga panel + kartu statistik yang dihitung
// dari data mock; kini: Rujukan masuk · Rujukan keluar (baru) · Rujukan khusus · Referensi.
// Komponen shadcn: Tabs · Badge · Skeleton (kartu tanpa garis, aksen emerald).

import { Suspense, useCallback, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { BookMarked, Inbox, Library, Route, Send, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSkeletonDelay } from "@/components/master/shared";
import { cn } from "@/lib/ui/utils";
import RujukanMasukTab from "./RujukanMasukTab";
import RujukanKeluarTab from "./RujukanKeluarTab";
import RujukanKhususTab from "./RujukanKhususTab";
import ReferensiTab from "./ReferensiTab";

const TABS = [
  { key: "masuk", label: "Rujukan masuk", icon: Inbox },
  { key: "keluar", label: "Rujukan keluar", icon: Send },
  { key: "khusus", label: "Rujukan khusus", icon: BookMarked },
  { key: "referensi", label: "Referensi", icon: Library },
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
      <div className="grid flex-1 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}

function RujukanPageInner() {
  const loaded = useSkeletonDelay(400);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = searchParams.get("tab");
  const tab: TabKey = isTab(t) ? t : "masuk";
  const [dikunjungi, setDikunjungi] = useState<ReadonlySet<TabKey>>(() => new Set([tab]));
  if (!dikunjungi.has(tab)) setDikunjungi(new Set(dikunjungi).add(tab)); // adjust-on-render

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

  if (!loaded) return <PageSkeleton />;

  return (
    <MotionConfig reducedMotion="user">
      <div data-accent="emerald" className="flex h-full min-h-0 flex-col text-foreground">
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Route className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Rujukan</h1>
            <p className="truncate text-xs text-muted-foreground">Rujukan masuk, keluar, khusus, dan referensi faskes lewat V-Claim BPJS</p>
          </div>
          <Badge variant="secondary" className="bg-white text-[11px] text-muted-foreground tabular-nums shadow-xs">
            V-Claim
          </Badge>
        </header>

        <Tabs value={tab} onValueChange={gantiTab} activationMode="manual" className="min-h-0 flex-1 gap-0">
          <div className="shrink-0 overflow-x-auto px-4 pt-3 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
            <TabsList variant="line" aria-label="Fitur rujukan" className="w-max gap-1">
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

          {(
            [
              ["masuk", <RujukanMasukTab key="masuk" />],
              ["keluar", <RujukanKeluarTab key="keluar" />],
              ["khusus", <RujukanKhususTab key="khusus" />],
              ["referensi", <ReferensiTab key="referensi" />],
            ] as [TabKey, ReactNode][]
          ).map(([key, isi]) => (
            <TabsContent
              key={key}
              value={key}
              forceMount={dikunjungi.has(key) || undefined}
              className="min-h-0 overflow-y-auto data-[state=inactive]:hidden"
            >
              {dikunjungi.has(key) && isi}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MotionConfig>
  );
}

export default function RujukanPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RujukanPageInner />
    </Suspense>
  );
}
