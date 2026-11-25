"use client";

// BPJS V-Claim → Rencana Kontrol. Dulu 7 tab per endpoint (Cari SEP · Insert/Update RK · SPRI ·
// Hapus · No. Surat · Data List · Referensi) + kartu statistik dari data mock; kini 3 tab per
// TUGAS: Daftar surat (lihat/saring/unduh → detail, ubah, hapus) · Rencana kontrol (terbitkan /
// ubah, dari SEP asal + PRB) · SPRI (terbitkan / ubah, dari No. kartu). Referensi poli & dokter
// menyatu ke langkah pilih tujuan di form. Tab tersimpan di URL (`?tab=`, history.replaceState),
// aktivasi manual; panel dipasang saat pertama dikunjungi lalu tetap terpasang (isian form tidak
// hilang saat pindah tab). Komponen shadcn: Tabs · Badge · Skeleton (kartu tanpa garis, aksen
// emerald).

import { Suspense, useCallback, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { BedDouble, CalendarCheck2, CalendarPlus, ListChecks, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSkeletonDelay } from "@/components/master/shared";
import { cn } from "@/lib/ui/utils";
import DaftarSuratTab from "./DaftarSuratTab";
import FormSurat, { type PermintaanForm } from "./FormSurat";
import { jenisDariKode, type BarisSurat, type JenisSurat } from "./rencanaKontrolShared";

const TABS = [
  { key: "daftar", label: "Daftar surat", icon: ListChecks },
  { key: "kontrol", label: "Rencana kontrol", icon: CalendarPlus },
  { key: "spri", label: "SPRI", icon: BedDouble },
] as const satisfies readonly { key: string; label: string; icon: LucideIcon }[];

type TabKey = (typeof TABS)[number]["key"];

function isTab(v: string | null): v is TabKey {
  return TABS.some((t) => t.key === v);
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-5" aria-hidden="true">
      <Skeleton className="h-10 w-72 rounded-lg" />
      <Skeleton className="h-9 w-full max-w-md rounded-lg" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

function RencanaKontrolPageInner() {
  const loaded = useSkeletonDelay(400);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = searchParams.get("tab");
  const tab: TabKey = isTab(t) ? t : "daftar";
  const [dikunjungi, setDikunjungi] = useState<ReadonlySet<TabKey>>(() => new Set([tab]));
  if (!dikunjungi.has(tab)) setDikunjungi(new Set(dikunjungi).add(tab)); // adjust-on-render
  const [permintaan, setPermintaan] = useState<Record<JenisSurat, PermintaanForm | null>>({ kontrol: null, spri: null });
  const [versiDaftar, setVersiDaftar] = useState(0);

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

  const bukaForm = useCallback(
    (jenis: JenisSurat, b: BarisSurat | null) => {
      setPermintaan((p) => {
        const n = (p[jenis]?.n ?? 0) + 1;
        return { ...p, [jenis]: { n, ubah: b ? { noSurat: b.noSuratKontrol, noKartu: b.noKartu, nama: b.nama, n } : null } };
      });
      gantiTab(jenis);
    },
    [gantiTab],
  );

  const keDaftar = useCallback(() => gantiTab("daftar"), [gantiTab]);
  const tersimpan = useCallback(() => setVersiDaftar((v) => v + 1), []);

  if (!loaded) return <PageSkeleton />;

  const panel: Record<TabKey, ReactNode> = {
    daftar: <DaftarSuratTab versi={versiDaftar} onBaru={(j) => bukaForm(j, null)} onUbah={(b) => bukaForm(jenisDariKode(b.jnsKontrol), b)} />,
    kontrol: <FormSurat jenis="kontrol" permintaan={permintaan.kontrol} aktif={tab === "kontrol"} onKeDaftar={keDaftar} onTersimpan={tersimpan} />,
    spri: <FormSurat jenis="spri" permintaan={permintaan.spri} aktif={tab === "spri"} onKeDaftar={keDaftar} onTersimpan={tersimpan} />,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div data-accent="emerald" className="flex h-full min-h-0 flex-col text-foreground">
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <CalendarCheck2 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Rencana kontrol</h1>
            <p className="truncate text-xs text-muted-foreground">Surat rencana kontrol dan SPRI pasien BPJS lewat V-Claim, lengkap dengan jadwal poli dan dokter</p>
          </div>
          <Badge variant="secondary" className="bg-white text-[11px] text-muted-foreground tabular-nums shadow-xs">
            V-Claim
          </Badge>
        </header>

        <Tabs value={tab} onValueChange={gantiTab} activationMode="manual" className="min-h-0 flex-1 gap-0">
          <div className="shrink-0 overflow-x-auto px-4 pt-3 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
            <TabsList variant="line" aria-label="Fitur rencana kontrol" className="w-max gap-1">
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

export default function RencanaKontrolPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RencanaKontrolPageInner />
    </Suspense>
  );
}
