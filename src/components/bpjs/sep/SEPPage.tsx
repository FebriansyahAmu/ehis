"use client";

// BPJS V-Claim → SEP. Kerangka 6 sub-tab (Tabs shadcn/Radix) yang tersimpan di URL (`?tab=`,
// lewat history.replaceState — tanpa round-trip server). Aktivasi tab MANUAL (Enter/klik)
// karena memilih tab mengubah URL. `?update=<noSEP>` tetap membuka tab Update Tgl Pulang.
// Tahap 1 redesign: kerangka + tab Cari SEP + modal Hapus SEP. Tab lain masih komponen lama,
// dibungkus kartu baru (dirombak bertahap).

import { Suspense, useCallback, useRef, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  ArrowRightLeft,
  CalendarClock,
  FileText,
  Fingerprint,
  Link2,
  Loader2,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSkeletonDelay } from "@/components/master/shared";
import { useSessionOptional } from "@/contexts/SessionContext";
import { cn } from "@/lib/ui/utils";
import { deleteSEP, getSEP } from "@/lib/bpjs/vClaimSEP";
import type { BPJSError, SEPRecordExt } from "@/lib/bpjs/bpjsShared";

import CariSEPPanel from "./CariSEPPanel";
import SEPDetailCard from "./SEPDetailCard";
import HapusSEPModal from "./HapusSEPModal";
import UpdateTglPulangForm from "./UpdateTglPulangForm";
import UpdateTglPulangList from "./UpdateTglPulangList";
import SEPIntegrasiInaCBGCard from "./SEPIntegrasiInaCBGCard";
import SuplesiJasaRaharjaForm from "./SuplesiJasaRaharjaForm";
import DataIndukKecelakaanForm from "./DataIndukKecelakaanForm";
import SEPInternalForm from "./SEPInternalForm";
import SEPInternalList from "./SEPInternalList";
import FingerprintPanel from "./FingerprintPanel";
import FingerprintListPanel from "./FingerprintListPanel";
import { BADGE, DOT, STATUS_META, errorLabel, type BadgeTone, type SEPResult } from "./sepShared";

// ── Tab ────────────────────────────────────────────────────

const TABS = [
  { key: "cari", label: "Cari SEP", icon: FileText },
  { key: "update-tgl", label: "Update tgl pulang", icon: CalendarClock },
  { key: "integrasi", label: "Integrasi E-Klaim", icon: Link2 },
  { key: "suplesi", label: "Suplesi Jasa Raharja", icon: ShieldAlert },
  { key: "internal", label: "SEP internal", icon: ArrowRightLeft },
  { key: "fingerprint", label: "Fingerprint", icon: Fingerprint },
] as const satisfies readonly { key: string; label: string; icon: LucideIcon }[];

type TabKey = (typeof TABS)[number]["key"];

function isTab(v: string | null): v is TabKey {
  return TABS.some((t) => t.key === v);
}

function tabDari(sp: { get(name: string): string | null }): TabKey {
  const t = sp.get("tab");
  if (isTab(t)) return t;
  if (sp.get("update")) return "update-tgl";
  return "cari";
}

function getErrMsg(err: BPJSError): string {
  if ("message" in err && typeof err.message === "string") return err.message;
  if (err.type === "EligibilityError") return `Eligibility error: ${err.reason}`;
  if (err.type === "DuplicateClaimError") return `Duplikasi klaim: ${err.existingClaimId}`;
  if (err.type === "ConcurrencyError") return "Konflik versi data";
  return "Terjadi kesalahan";
}

// ── Potongan UI ───────────────────────────────────────────

const KARTU = "rounded-xl bg-card shadow-sm";

function Kartu({ judul, deskripsi, children, className }: { judul?: string; deskripsi?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn(KARTU, "min-w-0 overflow-hidden", className)}>
      {judul && (
        <header className="px-4 pt-4">
          <h2 className="text-sm font-semibold text-foreground">{judul}</h2>
          {deskripsi && <p className="mt-0.5 text-xs text-muted-foreground">{deskripsi}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

interface RiwayatItem {
  noSEP: string;
  at: number;
  label: string;
  tone: BadgeTone;
}

function RiwayatSEP({ items, onPilih, onHapus }: { items: RiwayatItem[]; onPilih: (no: string) => void; onHapus: () => void }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="riwayat-sep" className={KARTU}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <h2 id="riwayat-sep" className="text-xs font-semibold text-foreground">
          Riwayat sesi ini
        </h2>
        <Button variant="ghost" size="xs" onClick={onHapus} className="text-muted-foreground">
          Hapus
        </Button>
      </div>
      <ul className="p-1.5">
        {items.map((r) => (
          <li key={r.noSEP}>
            <button
              type="button"
              onClick={() => onPilih(r.noSEP)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{r.noSEP}</span>
              <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium", BADGE[r.tone])}>
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT[r.tone])} />
                {r.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-5" aria-hidden="true">
      <div className="h-10 w-72 rounded-lg bg-muted motion-safe:animate-pulse" />
      <div className="h-9 w-full max-w-2xl rounded-lg bg-muted motion-safe:animate-pulse" />
      <div className="grid flex-1 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="h-80 rounded-xl bg-muted motion-safe:animate-pulse" />
        <div className="h-80 rounded-xl bg-muted motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

// ── Halaman ───────────────────────────────────────────────

function SEPPageInner() {
  const loaded = useSkeletonDelay(400);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const sesi = useSessionOptional();

  const tab = tabDari(searchParams);
  const initialUpdateNoSEP = searchParams.get("update") ?? undefined;

  const [noInput, setNoInput] = useState("");
  const [result, setResult] = useState<SEPResult>({ status: "idle" });
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SEPRecordExt | null>(null);
  const [updateRefresh, setUpdateRefresh] = useState(0);
  const lastNo = useRef<string | null>(null);
  const reqId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const gantiTab = useCallback(
    (v: string) => {
      if (!isTab(v)) return;
      // replaceState: Next.js menyinkronkan useSearchParams tanpa memuat ulang segmen dari server.
      window.history.replaceState(null, "", `${pathname}?tab=${v}`);
      requestAnimationFrame(() => {
        document.querySelector(`[data-tab="${v}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    },
    [pathname],
  );

  const cari = useCallback(async (no: string) => {
    const id = ++reqId.current;
    lastNo.current = no;
    setResult({ status: "loading" });
    let next: SEPResult;
    try {
      const res = await getSEP(no);
      if (res.ok && res.value.response) next = { status: "found", sep: res.value.response };
      else if (res.ok)
        next = {
          status: "error",
          error: { type: "BPJSMetaError", code: "201", message: "SEP tidak ditemukan", endpoint: "", retryable: false },
        };
      else next = { status: "error", error: res.error };
    } catch {
      next = {
        status: "error",
        error: { type: "BPJSMetaError", code: "503", message: "Koneksi ke V-Claim gagal", endpoint: "", retryable: true },
      };
    }
    if (id !== reqId.current) return; // sudah disusul pencarian lain
    setResult(next);
    const item: RiwayatItem =
      next.status === "found"
        ? { noSEP: no, at: Date.now(), label: STATUS_META[next.sep.statusInternal].label, tone: STATUS_META[next.sep.statusInternal].tone }
        : { noSEP: no, at: Date.now(), label: next.status === "error" ? errorLabel(next.error).title : "—", tone: "slate" };
    setRiwayat((prev) => [item, ...prev.filter((r) => r.noSEP !== no)].slice(0, 6));
  }, []);

  const cariDari = useCallback(
    (no: string) => {
      setNoInput(no);
      void cari(no);
    },
    [cari],
  );

  const ulang = useCallback(() => {
    if (lastNo.current) void cari(lastNo.current);
  }, [cari]);

  const cariLagi = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const hapusKonfirmasi = useCallback(
    async (noSep: string) => {
      const res = await deleteSEP({ noSep, user: sesi?.session?.username ?? "tanpa-sesi" });
      if (!res.ok) throw new Error(getErrMsg(res.error));
    },
    [sesi?.session?.username],
  );

  if (!loaded) return <PageSkeleton />;

  const busy = result.status === "loading";

  return (
    <MotionConfig reducedMotion="user">
      <div data-accent="emerald" className="flex h-full min-h-0 flex-col text-foreground">
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">Surat Eligibilitas Peserta</h1>
            <p className="truncate text-xs text-muted-foreground">Cari, periksa, dan kelola SEP lewat V-Claim BPJS</p>
          </div>
          <AnimatePresence>
            {busy && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700"
              >
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Menghubungi V-Claim
              </motion.span>
            )}
          </AnimatePresence>
          <Badge variant="secondary" className="bg-white font-mono text-[11px] text-muted-foreground shadow-xs">
            V-Claim 5.0
          </Badge>
        </header>

        <Tabs value={tab} onValueChange={gantiTab} activationMode="manual" className="min-h-0 flex-1 gap-0">
          <div className="shrink-0 overflow-x-auto px-4 pt-3 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
            <TabsList variant="line" aria-label="Fitur SEP" className="w-max gap-1">
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

          <p role="status" className="sr-only">
            {result.status === "found"
              ? `SEP ${result.sep.noSEP} ditemukan, status ${STATUS_META[result.sep.statusInternal].label}`
              : result.status === "error"
                ? errorLabel(result.error).title
                : ""}
          </p>

          {/* Cari SEP */}
          <TabsContent value="cari" className="min-h-0 overflow-y-auto lg:overflow-hidden">
            <div className="grid h-full content-start gap-4 p-4 sm:p-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:content-stretch">
              <aside className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
                <Kartu judul="Cari SEP" deskripsi="Nomor SEP dari kartu pasien atau berkas klaim">
                  <div className="p-4">
                    <CariSEPPanel value={noInput} onChange={setNoInput} onSubmit={cariDari} busy={busy} inputRef={inputRef} />
                  </div>
                </Kartu>
                <RiwayatSEP items={riwayat} onPilih={cariDari} onHapus={() => setRiwayat([])} />
              </aside>
              <section aria-label="Detail SEP" className="min-w-0 lg:min-h-0 lg:overflow-y-auto">
                <SEPDetailCard result={result} onRetry={ulang} onDelete={setDeleteTarget} onCariLagi={cariLagi} />
              </section>
            </div>
          </TabsContent>

          {/* Update tgl pulang */}
          <TabsContent value="update-tgl" className="min-h-0 overflow-y-auto">
            <div className="grid content-start gap-4 p-4 sm:p-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
              <Kartu judul="Update tanggal pulang" deskripsi="Untuk SEP rawat inap yang pasiennya sudah pulang">
                <UpdateTglPulangForm initialNoSEP={initialUpdateNoSEP} onSuccess={() => setUpdateRefresh((n) => n + 1)} />
              </Kartu>
              <Kartu>
                <UpdateTglPulangList refreshKey={updateRefresh} />
              </Kartu>
            </div>
          </TabsContent>

          {/* Integrasi E-Klaim */}
          <TabsContent value="integrasi" className="min-h-0 overflow-y-auto">
            <div className="mx-auto max-w-2xl p-4 sm:p-5">
              <Kartu>
                <SEPIntegrasiInaCBGCard />
              </Kartu>
            </div>
          </TabsContent>

          {/* Suplesi Jasa Raharja */}
          <TabsContent value="suplesi" className="min-h-0 overflow-y-auto">
            <div className="grid content-start gap-4 p-4 sm:p-5 lg:grid-cols-2">
              <Kartu>
                <SuplesiJasaRaharjaForm />
              </Kartu>
              <Kartu>
                <DataIndukKecelakaanForm />
              </Kartu>
            </div>
          </TabsContent>

          {/* SEP internal */}
          <TabsContent value="internal" className="min-h-0 overflow-y-auto">
            <div className="grid content-start gap-4 p-4 sm:p-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
              <Kartu>
                <SEPInternalForm />
              </Kartu>
              <Kartu>
                {/* Klik baris → buka SEP itu di tab Cari SEP (dulu tidak melakukan apa-apa). */}
                <SEPInternalList
                  onSelectSEP={(no) => {
                    gantiTab("cari");
                    cariDari(no);
                  }}
                />
              </Kartu>
            </div>
          </TabsContent>

          {/* Fingerprint */}
          <TabsContent value="fingerprint" className="min-h-0 overflow-y-auto">
            <div className="grid content-start gap-4 p-4 sm:p-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
              <Kartu>
                <FingerprintPanel />
              </Kartu>
              <Kartu>
                <FingerprintListPanel />
              </Kartu>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <HapusSEPModal
        sep={deleteTarget}
        onConfirm={hapusKonfirmasi}
        onClose={() => setDeleteTarget(null)}
        onDeleted={ulang}
      />
    </MotionConfig>
  );
}

export default function SEPPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SEPPageInner />
    </Suspense>
  );
}
