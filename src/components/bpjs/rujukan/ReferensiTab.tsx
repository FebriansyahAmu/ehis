"use client";

// Tab Referensi: dua sub-tab (Tabs shadcn varian pil) — Faskes (cari FKTP/FKRTL + kapasitas
// rujukan rumah sakit per spesialistik) dan Spesialistik. Sub-tab memilih saat fokus berpindah
// (tidak mengubah URL, panel instan). Komponen shadcn: Card · Tabs.

import { Building2, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReferensiFaskes from "./ReferensiFaskes";
import ReferensiSpesialistik from "./ReferensiSpesialistik";
import { KARTU } from "./rujukanUi";

// Pil aktif = latar putih + bayangan; di forced-colors keduanya hilang → garis bawah teks sebagai
// penanda bentuk (bukan warna saja).
const PIL = "gap-1.5 rounded-lg px-3 text-xs forced-colors:data-[state=active]:underline forced-colors:data-[state=active]:underline-offset-4";

export default function ReferensiTab() {
  return (
    <div className="p-4 sm:p-5">
      <Card className={KARTU}>
        <Tabs defaultValue="faskes" className="gap-3 py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">Referensi rujukan</h2>
              <p className="text-xs text-muted-foreground">Faskes tujuan dan daftar spesialistik dari V-Claim</p>
            </div>
            <TabsList aria-label="Jenis referensi" className="h-8 rounded-xl bg-slate-100">
              <TabsTrigger value="faskes" className={PIL}>
                <Building2 className="size-3.5" aria-hidden="true" />
                Faskes
              </TabsTrigger>
              <TabsTrigger value="spesialistik" className={PIL}>
                <Layers className="size-3.5" aria-hidden="true" />
                Spesialistik
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="faskes">
            <ReferensiFaskes />
          </TabsContent>
          <TabsContent value="spesialistik">
            <ReferensiSpesialistik />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
