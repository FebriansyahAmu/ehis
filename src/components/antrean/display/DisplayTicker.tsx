"use client";

// ANT7 — Ticker running text di bawah layar (pengumuman ruang tunggu).

import { Megaphone } from "lucide-react";

const MESSAGES = [
  "Selamat datang di RS Sakti Husada.",
  "Mohon perhatikan nomor antrean Anda pada layar.",
  "Pasien BPJS harap menyiapkan kartu JKN dan surat rujukan.",
  "Dilarang merokok di area rumah sakit.",
  "Jaga kebersihan dan tetap gunakan masker bila perlu.",
];

export function DisplayTicker({ text }: { text?: string }) {
  const content = text ?? MESSAGES.join("       •       ");
  return (
    <div className="flex items-center gap-4 overflow-hidden rounded-2xl bg-sky-600 px-5 py-3 text-white">
      <span className="flex shrink-0 items-center gap-2 text-lg font-bold uppercase tracking-wide">
        <Megaphone className="h-5 w-5" /> Info
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div className="ehis-marquee whitespace-nowrap text-xl font-medium">
          {content}
          <span className="px-12">•</span>
          {content}
        </div>
      </div>

      <style jsx>{`
        .ehis-marquee {
          display: inline-block;
          padding-left: 100%;
          animation: ehis-ticker 40s linear infinite;
        }
        @keyframes ehis-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ehis-marquee { animation: none; padding-left: 0; }
        }
      `}</style>
    </div>
  );
}
