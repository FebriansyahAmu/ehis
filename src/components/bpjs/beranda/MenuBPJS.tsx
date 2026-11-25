"use client";

// Kartu "Menu" Beranda BPJS: pintasan ke semua halaman modul per grup (V-Claim · Aplicares · Audit).
// Tiap entri = SATU tautan (seluruh baris bisa diklik, tanpa kontrol lain di dalamnya).
// Komponen shadcn: Card · Item.

import { useId } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { KepalaKartu } from "@/components/bpjs/shared/daftarUi";
import { KARTU } from "@/components/bpjs/shared/vclaimUi";
import { MENU } from "./berandaShared";

export default function MenuBPJS() {
  const id = useId();
  return (
    <Card className={KARTU}>
      <nav aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
        <KepalaKartu judulId={`${id}-judul`} judul="Menu BPJS" deskripsi="Semua halaman V-Claim, Aplicares, dan audit" />
        <div className="flex flex-col gap-3 px-2">
          {MENU.map((g) => (
            <div key={g.grup} className="flex flex-col gap-0.5">
              <h3 className="px-2 text-[11px] font-medium text-muted-foreground">{g.grup}</h3>
              <ul className="flex flex-col">
                {g.item.map((m) => {
                  const Ikon = m.ikon;
                  return (
                    <li key={m.href}>
                      <Item
                        asChild
                        size="sm"
                        className="group flex-nowrap gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600"
                      >
                        <Link href={m.href}>
                          <span
                            aria-hidden="true"
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700"
                          >
                            <Ikon className="size-4" />
                          </span>
                          <ItemContent className="min-w-0 gap-0">
                            <ItemTitle className="text-xs font-semibold">{m.label}</ItemTitle>
                            <ItemDescription className="line-clamp-1 text-[11px]">{m.ket}</ItemDescription>
                          </ItemContent>
                          <ChevronRight
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                          />
                        </Link>
                      </Item>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </Card>
  );
}
