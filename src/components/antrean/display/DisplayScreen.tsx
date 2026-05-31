"use client";

// ANT7 — Display antrean (layar ruang tunggu, full-screen). Hero panggilan + daftar
// terakhir + ticker + jam live + flash & TTS saat dipanggil/recall.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Hospital, Clock, Volume2, VolumeX, Maximize2, Minimize2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAntreanStore, seedAntrean } from "@/lib/antrean/antreanStore";
import { buildSeedAntrean } from "@/lib/antrean/antreanSeed";
import { useLoketStore } from "@/lib/antrean/loketStore";
import { useFullscreen } from "../apm/useFullscreen";
import { CurrentCallHero } from "./CurrentCallHero";
import { RecentCallsList } from "./RecentCallsList";
import { DisplayTicker } from "./DisplayTicker";
import {
  buildCalls,
  callSignature,
  useAnnouncer,
  useClock,
  usePrefersReducedMotion,
} from "./displayShared";

/** "A-12" → "A 12" agar TTS membaca huruf & angka terpisah. */
function spellNomor(nomor: string): string {
  return nomor.replace(/-/g, " ");
}

export default function DisplayScreen() {
  const antrean = useAntreanStore();
  const loket = useLoketStore();
  const now = useClock();
  const reduced = usePrefersReducedMotion();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const [sound, setSound] = useState(false);
  const announce = useAnnouncer(sound);

  useEffect(() => {
    seedAntrean(buildSeedAntrean());
  }, []);

  const calls = useMemo(
    () => buildCalls(antrean.byKode, loket.panggilan),
    [antrean.byKode, loket.panggilan],
  );
  const hero = calls[0];
  const recent = calls.slice(1, 7);
  const sig = callSignature(hero);
  const announceText = hero ? `Nomor antrean ${spellNomor(hero.nomorAntrean)}. Menuju ${hero.loket}.` : "";

  // Umumkan (suara) saat hero berubah (panggilan / recall baru). Flash via key=sig di hero.
  const lastSig = useRef("");
  useEffect(() => {
    if (!sig || sig === lastSig.current) return;
    lastSig.current = sig;
    if (announceText) announce(announceText);
  }, [sig, announceText, announce]);

  const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const tanggal = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex h-screen w-screen flex-col gap-4 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 p-5 text-white">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-sky-500/30">
            <Hospital className="h-7 w-7" />
          </span>
          <div className="leading-tight">
            <p className="text-2xl font-extrabold tracking-tight">RS Sakti Husada</p>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-300">Antrean Pendaftaran</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSound((s) => !s)}
            title={sound ? "Matikan suara panggilan" : "Aktifkan suara panggilan"}
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition-colors",
              sound ? "bg-emerald-500/20 text-emerald-300 ring-emerald-400/30" : "bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10",
            )}
          >
            {sound ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-white/10"
          >
            {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
          </button>

          <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-5 py-2.5 ring-1 ring-white/10">
            <Clock className="h-6 w-6 text-sky-300" />
            <div className="flex flex-col items-end leading-tight">
              <span suppressHydrationWarning className="font-mono text-3xl font-black tabular-nums">{jam}</span>
              <span suppressHydrationWarning className="text-xs text-slate-400">{tanggal}</span>
            </div>
          </div>

          <Link
            href="/ehis-antrian"
            title="Keluar dari Display"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
          >
            <LogOut className="h-6 w-6" />
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.9fr_1fr]">
        <CurrentCallHero call={hero} signature={sig} reducedMotion={reduced} />
        <RecentCallsList calls={recent} />
      </main>

      {/* Ticker */}
      <footer className="shrink-0">
        <DisplayTicker />
      </footer>
    </div>
  );
}
