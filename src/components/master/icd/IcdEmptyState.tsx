"use client";

import { BookText } from "lucide-react";
import { MasterEmptyState } from "@/components/master/shared";
import { JENIS_CFG } from "./icdShared";
import type { IcdJenis } from "@/lib/master/icdMock";

export default function IcdEmptyState({
  totalItem, onAddNew, jenis,
}: {
  totalItem: number;
  onAddNew: () => void;
  jenis: IcdJenis;
}) {
  const cfg = JENIS_CFG[jenis];
  return (
    <MasterEmptyState
      accent="sky"
      icon={BookText}
      title="Pilih kode di kiri"
      description={`Atau tambah kode ${cfg.label} baru. ${cfg.desc}. Saat backend siap, gunakan tombol Import CSV untuk dataset lengkap WHO/Kemkes.`}
      totalCount={totalItem}
      totalLabel="kode katalog"
      onAddNew={onAddNew}
      addLabel={`Tambah ${cfg.short}`}
    />
  );
}
