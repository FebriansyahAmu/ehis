"use client";

// Kartu "Perlu ditindaklanjuti" Beranda BPJS: disusun otomatis dari log panggilan (sambungan putus /
// tidak stabil, gagal & lambat hari ini) dan laporan ketersediaan kamar (belum terkini, ditutup
// sementara). Tiap baris punya SATU aksi kecil (tautan ke halaman terkait atau "Coba lagi") dengan
// nama aksesibel yang dibedakan per baris. Kosong → pesan "Semua beres".
// Komponen shadcn: Card · Item · Badge · Button · Skeleton.

import { useId } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { KepalaKartu, KerangkaDaftar } from "@/components/bpjs/shared/daftarUi";
import { BadgeNada, KARTU } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import type { NadaTugas, Tugas } from "./berandaShared";

const KOTAK: Record<NadaTugas, string> = {
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
};

function Aksi({ t, memuatKamar, onUlangKamar }: { t: Tugas; memuatKamar: boolean; onUlangKamar: () => void }) {
  const isi = (
    <>
      {t.aksi.label}
      <span className="sr-only">{t.aksi.konteks}</span>
    </>
  );
  if ("href" in t.aksi) {
    return (
      <Button asChild variant="secondary" size="xs">
        <Link href={t.aksi.href}>{isi}</Link>
      </Button>
    );
  }
  return (
    <Button
      variant="secondary"
      size="xs"
      onClick={() => {
        if (!memuatKamar) onUlangKamar();
      }}
      aria-disabled={memuatKamar}
      className="aria-disabled:cursor-wait aria-disabled:opacity-60"
    >
      <RotateCw aria-hidden="true" className={cn(memuatKamar && "animate-spin motion-reduce:animate-none")} />
      {isi}
    </Button>
  );
}

export default function KartuTugas({
  siap,
  tugas,
  kamarSiap,
  memuatKamar,
  onUlangKamar,
}: {
  siap: boolean;
  tugas: readonly Tugas[];
  /** Data kamar sudah dimuat (berhasil atau gagal) — "Semua beres" baru boleh tampil sesudahnya. */
  kamarSiap: boolean;
  memuatKamar: boolean;
  onUlangKamar: () => void;
}) {
  const id = useId();
  const nPenting = tugas.filter((t) => t.nada !== "slate").length;
  return (
    <Card className={KARTU}>
      <section className="flex flex-col gap-3 py-4">
        <KepalaKartu judulId={`${id}-judul`} judul="Perlu ditindaklanjuti" deskripsi="Disusun otomatis dari log panggilan dan laporan ketersediaan kamar">
          {siap && tugas.length > 0 && (
            <BadgeNada tone={nPenting > 0 ? "amber" : "slate"} className="tabular-nums">
              {tugas.length} hal
            </BadgeNada>
          )}
        </KepalaKartu>

        {!siap || (tugas.length === 0 && !kamarSiap) ? (
          <div className="px-3">
            <KerangkaDaftar baris={3} tinggi="h-14" />
          </div>
        ) : tugas.length === 0 ? (
          <div className="mx-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3 py-3 text-xs/relaxed text-emerald-950">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <p>
              <span className="font-semibold">Semua beres.</span> Sambungan ke BPJS lancar, laporan kamar terkini, dan tidak ada panggilan gagal
              hari ini.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5 px-2">
            {tugas.map((t, i) => {
              const Ikon = t.ikon;
              return (
                <motion.li key={t.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, delay: i * 0.03 }}>
                  <Item size="sm" className="flex-nowrap items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 sm:items-center">
                    <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", KOTAK[t.nada])}>
                      <Ikon className="size-4" />
                    </span>
                    <ItemContent className="min-w-0 gap-0.5">
                      <ItemTitle className="w-auto text-xs font-semibold tabular-nums">{t.judul}</ItemTitle>
                      <ItemDescription className="text-[11px] text-pretty tabular-nums">{t.ket}</ItemDescription>
                    </ItemContent>
                    <ItemActions className="shrink-0">
                      <Aksi t={t} memuatKamar={memuatKamar} onUlangKamar={onUlangKamar} />
                    </ItemActions>
                  </Item>
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>
    </Card>
  );
}
