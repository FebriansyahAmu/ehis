"use client";

// ANT7 — Info berjalan di kaki layar. Geser hanya bila pengguna tidak meminta gerak
// dikurangi (animasi di-opt-in lewat `prefers-reduced-motion: no-preference`); bila
// dikurangi, pesan berganti satu per satu dengan pudar. Bisa dijeda dari kontrol layar.

import { Fragment, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Megaphone } from "lucide-react";

function daftarPesan(namaRs: string): string[] {
  return [
    `Selamat datang di ${namaRs}`,
    "Perhatikan nomor antrean Anda pada layar",
    "Pasien BPJS harap menyiapkan kartu JKN dan surat rujukan",
    "Dilarang merokok di area rumah sakit",
    "Jaga kebersihan dan gunakan masker bila perlu",
  ];
}

export function DisplayTicker({ namaRs, paused }: { namaRs: string; paused: boolean }) {
  const reduce = useReducedMotion();
  const pesan = useMemo(() => daftarPesan(namaRs), [namaRs]);

  const salinan = (hidden: boolean) => (
    <span aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-12 pr-12">
      {pesan.map((m) => (
        <Fragment key={m}>
          <span>{m}</span>
          <span aria-hidden="true" className="size-1.5 rounded-full bg-(--d-text)/25" />
        </Fragment>
      ))}
    </span>
  );

  return (
    <footer className="flex h-14 shrink-0 items-center gap-5 overflow-hidden rounded-2xl bg-(--d-panel) px-6 ring-1 ring-(--d-line)">
      <span className="flex shrink-0 items-center gap-2 text-lg text-(--d-text-2)">
        <Megaphone className="size-5" strokeWidth={1.5} aria-hidden="true" />
        Info
      </span>
      <span aria-hidden="true" className="h-6 w-px shrink-0 bg-(--d-text)/15" />

      <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]">
        {reduce ? (
          <PesanBergilir pesan={pesan} paused={paused} />
        ) : (
          <div
            className="ehis-ticker flex w-max text-xl whitespace-nowrap text-(--d-text-2)"
            style={{ animationPlayState: paused ? "paused" : "running" }}
          >
            {salinan(false)}
            {salinan(true)}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes ehis-ticker {
          from {
            translate: 0;
          }
          to {
            translate: -50%;
          }
        }
        @media (prefers-reduced-motion: no-preference) {
          .ehis-ticker {
            animation: ehis-ticker 48s linear infinite;
          }
        }
      `}</style>
    </footer>
  );
}

function PesanBergilir({ pesan, paused }: { pesan: string[]; paused: boolean }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % pesan.length), 6000);
    return () => clearInterval(t);
  }, [paused, pesan.length]);

  return (
    <div className="grid">
      <AnimatePresence initial={false}>
        <motion.p
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="col-start-1 row-start-1 truncate text-xl text-(--d-text-2)"
        >
          {pesan[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
