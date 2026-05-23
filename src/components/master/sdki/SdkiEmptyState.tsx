"use client";

import { ClipboardList } from "lucide-react";
import { MasterEmptyState } from "@/components/master/shared";

export default function SdkiEmptyState({
  totalItem, onAddNew,
}: {
  totalItem: number;
  onAddNew: () => void;
}) {
  return (
    <MasterEmptyState
      accent="rose"
      icon={ClipboardList}
      title="Pilih diagnosa di kiri"
      description="Atau tambah diagnosa keperawatan baru — lengkapi kode D.NNNN, kategori (Fisiologis/Psikologis/Perilaku/Relasional/Lingkungan), data klinis mayor & minor, kriteria hasil SLKI, dan intervensi SIKI dengan 4 sub-kategori."
      totalCount={totalItem}
      totalLabel="diagnosa keperawatan"
      onAddNew={onAddNew}
      addLabel="Tambah Diagnosa Baru"
    />
  );
}
