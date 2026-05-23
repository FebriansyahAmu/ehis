"use client";

import { useState, useMemo } from "react";
import { Layers, ListChecks, Power, Tag } from "lucide-react";
import {
  MasterPageLayout, StatCard, useSkeletonDelay,
} from "@/components/master/shared";
import {
  STATUS_ENUM_GROUPS, type StatusEnumKey, type EnumEntry,
  getGroupByKey,
} from "@/lib/master/statusEnumMock";
import EnumSidebar from "./EnumSidebar";
import EnumTable from "./EnumTable";

export default function StatusEnumPage() {
  const loaded = useSkeletonDelay();
  const [activeKey, setActiveKey] = useState<StatusEnumKey>("status-pulang");
  const [groupsState, setGroupsState] = useState(STATUS_ENUM_GROUPS);

  const activeGroup = useMemo(
    () => groupsState.find((g) => g.key === activeKey) ?? groupsState[0],
    [groupsState, activeKey],
  );

  const stats = useMemo(() => {
    const total = groupsState.reduce((sum, g) => sum + g.entries.length, 0);
    const aktif = groupsState.reduce(
      (sum, g) => sum + g.entries.filter((e) => e.status === "Aktif").length,
      0,
    );
    const nonAktif = total - aktif;
    return { kategori: groupsState.length, total, aktif, nonAktif };
  }, [groupsState]);

  const handleEntriesChange = (entries: EnumEntry[]) => {
    setGroupsState((prev) =>
      prev.map((g) => (g.key === activeGroup.key ? { ...g, entries } : g)),
    );
  };

  return (
    <MasterPageLayout
      loaded={loaded}
      accent="violet"
      eyebrow="EHIS Master · Template & Enum"
      title="Status Enum"
      description="Katalog enum kecil lintas modul — dipakai PasienPulang/Discharge/Transfer/Edukasi. Mengganti hardcoded constants di kode dengan single source. Tambah/edit entri di sini akan mempengaruhi semua modul yang consume."
      stats={
        <>
          <StatCard icon={Layers}     label="Kategori"   value={stats.kategori}  tone="violet"  />
          <StatCard icon={ListChecks} label="Total Entri" value={stats.total}     tone="sky"     />
          <StatCard icon={Power}      label="Aktif"      value={stats.aktif}     tone="emerald" />
          <StatCard icon={Tag}        label="Non-Aktif"  value={stats.nonAktif}  tone="slate"   />
        </>
      }
      list={<EnumSidebar groups={groupsState} activeKey={activeGroup.key} onSelect={setActiveKey} />}
      detail={<EnumTable group={activeGroup} onChange={handleEntriesChange} />}
    />
  );
}
