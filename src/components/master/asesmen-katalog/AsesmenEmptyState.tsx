"use client";

import { ClipboardList } from "lucide-react";
import { MasterEmptyState } from "@/components/master/shared";

export default function AsesmenEmptyState({
  totalItem, onAddNew,
}: {
  totalItem: number;
  onAddNew: () => void;
}) {
  return (
    <MasterEmptyState
      accent="violet"
      icon={ClipboardList}
      title="Pilih item di kiri"
      description="Atau tambah item baru — pilih kategori (Allergen / Reaksi / Penyakit / Reproduksi / Anggota Keluarga), lalu lengkapi kode dan nama. SNOMED CT opsional untuk allergen tervalidasi."
      totalCount={totalItem}
      totalLabel="item katalog"
      onAddNew={onAddNew}
      addLabel="Tambah Item Baru"
    />
  );
}
