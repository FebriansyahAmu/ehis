"use client";

// ANT7 — Display antrean (layar TV ruang tunggu, full-screen). Tema terang (bawaan) atau
// gelap — pilihan tersimpan per perangkat; latar & panel netral, aksen sky hanya di loket
// tujuan, amber untuk panggilan ulang (token di displayTema.ts). Nomor saja — nama pasien
// tidak ditampilkan. Kontrol (suara · jeda info · tema · layar penuh · keluar) memudar
// setelah 3 detik tanpa aktivitas dan muncul lagi saat pointer bergerak, disentuh, atau fokus.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { LogOut, Maximize2, Minimize2, Moon, Pause, Play, Sun, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAntreanStore, seedAntrean } from "@/lib/antrean/antreanStore";
import { buildSeedAntrean } from "@/lib/antrean/antreanSeed";
import { useLoketStore } from "@/lib/antrean/loketStore";
import { useRsProfil } from "@/lib/master/rsProfilClient";
import { useFullscreen } from "../apm/useFullscreen";
import { CurrentCallHero } from "./CurrentCallHero";
import { RecentCallsList } from "./RecentCallsList";
import { InfoBoard } from "./InfoBoard";
import { DisplayTicker } from "./DisplayTicker";
import { buildCalls, callSignature, useAnnouncer, useClock, useIdle } from "./displayShared";
import { TEMA_TOKENS, useDisplayTema } from "./displayTema";

/** "A-12" → "A 12" agar TTS membaca huruf & angka terpisah. */
function spellNomor(nomor: string): string {
  return nomor.replace(/-/g, " ");
}

const CTRL =
  "inline-flex size-11 items-center justify-center rounded-lg text-(--d-text-2) transition-colors duration-150 hover:bg-(--d-raised) hover:text-(--d-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--d-accent)";

export default function DisplayScreen() {
  const antrean = useAntreanStore();
  const loket = useLoketStore();
  const rs = useRsProfil();
  const now = useClock();
  const idle = useIdle(3000);
  const [tema, setTema] = useDisplayTema();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const [sound, setSound] = useState(false);
  const [paused, setPaused] = useState(false);
  const announce = useAnnouncer(sound);

  useEffect(() => {
    seedAntrean(buildSeedAntrean());
  }, []);

  const calls = useMemo(() => buildCalls(antrean.byKode, loket.panggilan), [antrean.byKode, loket.panggilan]);
  const hero = calls[0];
  const recent = calls.slice(1, 6);
  const sig = callSignature(hero);
  const announceText = hero ? `Nomor antrean ${spellNomor(hero.nomorAntrean)}. Menuju ${hero.loket}.` : "";

  // Umumkan (suara) saat hero berubah (panggilan / recall baru). Sorot via key=sig di hero.
  const lastSig = useRef("");
  useEffect(() => {
    if (!sig || sig === lastSig.current) return;
    lastSig.current = sig;
    if (announceText) announce(announceText);
  }, [sig, announceText, announce]);

  const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const tanggal = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={TEMA_TOKENS[tema]}
        className={cn(
          "flex min-h-screen flex-col gap-6 bg-(--d-bg) p-6 text-(--d-text) transition-colors duration-500 lg:h-screen lg:p-8",
          idle && "cursor-none",
        )}
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <p className="truncate text-2xl font-medium text-(--d-text) lg:text-3xl">{rs.nama}</p>
            <p className="mt-1 text-lg text-(--d-text-2)">Antrean pendaftaran</p>
          </div>

          <div className="flex items-center gap-6">
            <div
              className={cn(
                "flex items-center gap-1 transition-opacity duration-300 focus-within:opacity-100",
                idle ? "opacity-0" : "opacity-100",
              )}
            >
              <CtrlButton label="Suara panggilan" pressed={sound} onClick={() => setSound((s) => !s)}>
                {sound ? <Volume2 className="size-5" strokeWidth={1.5} /> : <VolumeX className="size-5" strokeWidth={1.5} />}
              </CtrlButton>
              <CtrlButton label={paused ? "Putar info berjalan" : "Jeda info berjalan"} onClick={() => setPaused((p) => !p)}>
                {paused ? <Play className="size-5" strokeWidth={1.5} /> : <Pause className="size-5" strokeWidth={1.5} />}
              </CtrlButton>
              <CtrlButton
                label={tema === "terang" ? "Ganti ke tema gelap" : "Ganti ke tema terang"}
                onClick={() => setTema(tema === "terang" ? "gelap" : "terang")}
              >
                {tema === "terang" ? (
                  <Moon className="size-5" strokeWidth={1.5} />
                ) : (
                  <Sun className="size-5" strokeWidth={1.5} />
                )}
              </CtrlButton>
              <CtrlButton label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"} onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize2 className="size-5" strokeWidth={1.5} />
                ) : (
                  <Maximize2 className="size-5" strokeWidth={1.5} />
                )}
              </CtrlButton>
              <Link href="/ehis-antrian" aria-label="Keluar dari display" title="Keluar dari display" className={CTRL}>
                <LogOut className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </div>

            <div className="text-right">
              <p suppressHydrationWarning className="text-5xl leading-none font-light tabular-nums text-(--d-text)">
                {jam}
              </p>
              <p suppressHydrationWarning className="mt-2 text-base text-(--d-text-2)">
                {tanggal}
              </p>
            </div>
          </div>
        </header>

        <main className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <CurrentCallHero call={hero} signature={sig} announceText={announceText} />
          <div className="grid min-h-0 gap-6 lg:grid-rows-[minmax(0,1fr)_auto]">
            <RecentCallsList calls={recent} />
            <InfoBoard paused={paused} />
          </div>
        </main>

        <DisplayTicker namaRs={rs.nama} paused={paused} />
      </div>
    </MotionConfig>
  );
}

function CtrlButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  /** Hanya untuk tombol yang labelnya tetap (mis. suara); jangan dipakai bila label berganti. */
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(CTRL, pressed && "bg-(--d-raised) text-(--d-text)")}
    >
      {children}
    </button>
  );
}
